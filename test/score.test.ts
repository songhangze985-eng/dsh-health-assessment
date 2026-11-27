/**
 * 上游 `scripts/test_score.py` 的 19 个验收用例，逐条移植。
 *
 * 迁移原则：断言与 Python 版一一对应，不改判据。任何一条在 JS 侧不成立，
 * 都说明内核移植有偏差，而不是用例需要放宽。
 *
 * @module dsh-health-assessment/test/score.test
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { scorePayload } from '../src/core/score.js'
import type { ProfileRecord, ScorePayload, SessionRecord } from '../src/core/types.js'

const here = dirname(fileURLToPath(import.meta.url))

/** 与 Python 版 `profile()` 同形。 */
function profile(overrides: Partial<ProfileRecord> = {}): ProfileRecord {
  return {
    codename: 'fixture',
    height_cm: 172,
    weight_kg: 75,
    age: 36,
    sex: 'male',
    training_years: 0,
    injury: false,
    ...overrides,
  }
}

/** 与 Python 版 `day()` 同形。 */
function day(index: number, overrides: Partial<SessionRecord> = {}): SessionRecord {
  const item: SessionRecord = {
    date: `2026-10-${String(index).padStart(2, '0')}`,
    date_defaulted: false,
    red_flags: [],
    body_required: {
      protein_g: 120,
      resistance_sets: 3,
      resistance_load_kg: 40 + index,
      overload: true,
    },
    psych_required: {
      execution_likert: 5,
      classification: 'kept_and_changed',
    },
    optional: { 睡眠时长: 5, 边界感: 5 },
  }
  return { ...item, ...overrides }
}

function run(payload: ScorePayload): any {
  return scorePayload(payload)
}

test('full_window_totals_200', () => {
  const sessions = [1, 2, 3, 4, 5, 6, 7].map((i) => day(i))
  const result = run({ profile: profile(), sessions })
  assert.equal(result.mode, 'scored')
  assert.equal(result.scores.body.score, 100)
  assert.equal(result.scores.psych.score, 100)
  assert.equal(result.scores.total.score, 200)
  assert.ok(result.conclusion['薄肌'].includes('薄肌'))
  assert.ok(result.conclusion['黄毛'].includes('黄毛'))
  assert.ok(result.next_steps.length <= 3)
})

test('under_seven_has_no_score_and_two_steps_when_gap', () => {
  const sessions = [1, 2, 3].map((i) => day(i))
  for (const item of sessions) delete (item.body_required as any).protein_g
  const result = run({ profile: profile(), sessions })
  assert.equal(result.mode, 'under7')
  assert.equal(result.scores, null)
  assert.equal(result.label, '未满 7 天，不可统计分析')
  assert.ok(result.next_steps[0].startsWith('继续记到满 7'))
  assert.ok(result.next_steps[1].includes('蛋白质'))
  assert.ok(!result.next_steps.join(' ').includes('深蹲'))
})

test('missing_required_does_not_zero', () => {
  const sessions = [1, 2, 3, 4, 5, 6, 7].map((i) => day(i))
  for (const item of sessions) delete (item.body_required as any).protein_g
  const result = run({ profile: profile(), sessions })
  assert.equal(result.scores.body_required.status, '无法评分')
  assert.equal(result.scores.body_required.score, null)
  assert.equal(result.scores.body.status, '不合成')
  assert.equal(result.scores.total.status, '不合成')
  assert.ok(result.next_steps.some((step: string) => step.includes('蛋白质')))
})

test('red_flag_stops', () => {
  const sessions = [1, 2, 3, 4, 5, 6, 7].map((i) => day(i))
  sessions[0].red_flags = ['胸痛']
  const result = run({ profile: profile({ injury: true }), sessions })
  assert.equal(result.mode, 'redflag')
  assert.equal(result.scores, null)
  assert.ok(result.next_steps[0].includes('就医'))
  assert.ok(result.next_steps[0].includes('训练'))
})

test('custom_protein_target_is_used', () => {
  const custom = profile({
    targets: { protein_g_per_kg: 3, protein_source: 'user_outside_literature' },
  })
  const sessions = [1, 2, 3, 4, 5, 6, 7].map((i) => day(i))
  for (const item of sessions) (item.body_required as any).protein_g = 150
  const result = run({ profile: custom, sessions })
  assert.equal(result.scores.body_required.target_protein_g, 225)
  assert.equal(result.scores.body_required.parts['蛋白质'], 0.67)
})

test('likert_fallback_marked_by_ratio', () => {
  const sessions = [1, 2, 3, 4, 5, 6, 7].map((i) => day(i))
  for (const item of sessions) {
    delete (item.body_required as any).protein_g
    ;(item.body_required as any).protein_likert = 5
  }
  const result = run({ profile: profile(), sessions })
  assert.equal(result.scores.body_required.parts['蛋白质'], 1)
})

test('invalid_classification_lowers_psych', () => {
  const sessions = [1, 2, 3, 4, 5, 6, 7].map((i) => day(i))
  for (const item of sessions) (item.psych_required as any).classification = 'invalid'
  const result = run({ profile: profile(), sessions })
  assert.equal(result.scores.psych_required.points['评价分类'], 0)
  assert.equal(result.scores.psych_required.points['自评分'], 40)
})

test('blank_optional_is_not_zero', () => {
  const sessions = [1, 2, 3, 4, 5, 6, 7].map((i) => day(i))
  for (const item of sessions) item.optional = {}
  const result = run({ profile: profile(), sessions })
  assert.equal(result.scores.body_optional.status, '无法评分')
  assert.equal(result.scores.body_optional.score, null)
  assert.equal(result.scores.total.status, '不合成')
})

test('defaulted_date_counts_as_one_day', () => {
  const result = run({ profile: profile(), sessions: [day(1, { date_defaulted: true })] })
  assert.equal(result.distinct_dates, 1)
  assert.equal(result.raw_sessions[0].date_defaulted, true)
})

test('blocked_profile', () => {
  const incomplete = profile()
  delete incomplete.height_cm
  const result = run({ profile: incomplete, sessions: [day(1)] })
  assert.equal(result.mode, 'blocked_profile')
  assert.ok(result.missing_profile.includes('height_cm'))
})

test('injury_note_does_not_stop_score', () => {
  const result = run({ profile: profile({ injury: true }), sessions: [1, 2, 3, 4, 5, 6, 7].map((i) => day(i)) })
  assert.equal(result.mode, 'scored')
  assert.equal(result.scores.total.score, 200)
  assert.ok(result.injury_note.includes('备注'))
})

test('calendar_span_lowers_resistance_expectation', () => {
  const sessions = [1, 2, 3, 4, 5, 6, 19].map((i) => day(i))
  const result = run({ profile: profile(), sessions })
  assert.equal(result.mode, 'scored')
  assert.equal(result.distinct_dates, 7)
  assert.equal(result.calendar_span_days, 19)
  assert.ok(result.scores.body_required.parts['抗阻'] < 1)
})

test('window_span_counts_when_sessions_are_dense', () => {
  const result = run({
    profile: profile(),
    window: { start: '2026-09-18', end: '2026-10-07' },
    sessions: [1, 2, 3, 4, 5, 6, 7].map((i) => day(i)),
  })
  assert.equal(result.calendar_span_days, 20)
  assert.ok(result.scores.body_required.parts['抗阻'] < 1)
})

test('raw_text_red_flag_stops', () => {
  const sessions = [1, 2, 3, 4, 5, 6, 7].map((i) => day(i))
  sessions[0].red_flags = []
  sessions[0].note = '今天胸痛，先停一下'
  const result = run({ profile: profile(), sessions })
  assert.equal(result.mode, 'redflag')
  assert.equal(result.scores, null)
  assert.ok(result.red_flags.includes('胸痛'))
})

test('negated_red_flag_does_not_stop', () => {
  const sessions = [1, 2, 3, 4, 5, 6, 7].map((i) => day(i))
  sessions[0].note = '无胸痛，没有呼吸困难'
  const result = run({ profile: profile(), sessions })
  assert.equal(result.mode, 'scored')
  assert.equal(result.scores.total.score, 200)
})

test('extended_red_flag_in_raw_text', () => {
  const sessions = [1, 2, 3, 4, 5, 6, 7].map((i) => day(i))
  sessions[3].raw_text = '膝盖出现关节急性肿胀'
  const result = run({ profile: profile(), sessions })
  assert.equal(result.mode, 'redflag')
  assert.ok(result.red_flags.includes('关节急性肿胀'))
})

test('under7_reports_daily_gaps', () => {
  const result = run({ profile: profile(), sessions: [day(1), day(2)] })
  const progress = result.daily_progress
  assert.equal(progress.target_date, '2026-10-02')
  assert.equal(progress.required_completion_ratio, 1)
  assert.deepEqual(progress.missing_required_fields, [])
})

test('alias_fields_still_total_200', () => {
  const sessions = [1, 2, 3, 4, 5, 6, 7].map((i) => day(i, {
    body_required: {
      protein_g: 120,
      resistance_done: true,
      progressive_overload: true,
    },
    psych_required: {
      self_rating_1_to_5: 5,
      feedback_category: 'kept_and_changed',
    },
    optional: { sleep_quality: 1, stress_relief: 1 },
  }))
  const result = run({ profile: profile(), sessions })
  assert.equal(result.mode, 'scored')
  assert.equal(result.scores.total.score, 200)
})

test('fixture_file_matches_full_score', () => {
  const fixture = JSON.parse(readFileSync(join(here, 'fixtures/full-7.json'), 'utf8')) as ScorePayload
  const result = run(fixture)
  assert.equal(result.scores.total.score, 200)
})
