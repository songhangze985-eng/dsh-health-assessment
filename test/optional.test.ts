/**
 * 选填录入、自定义标准、单日删除的验收。
 *
 * 这几条锁定上游契约里最容易回归的三处：选填补分规则（平分 20、空记无法评分）、
 * 越界标准必须留审计但不拒绝保存、删除单日不误伤其他日期。
 *
 * @module dsh-health-assessment/test/optional.test
 */

import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { OPTIONAL_GROUPS, OPTIONAL_ITEMS } from '../src/core/optional-catalog.js'
import { BODY_OPTIONAL, PSYCH_OPTIONAL, scorePayload } from '../src/core/score.js'
import { HealthService } from '../src/host/service.js'
import { HealthStore, emptySession } from '../src/host/store.js'

/** 临时库。 */
async function withStore(run: (store: HealthStore, service: HealthService, root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'ha-opt-'))
  try {
    const store = new HealthStore(root)
    await store.ensure()
    await run(store, new HealthService(store), root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

/** 六项齐全的档案。 */
const PROFILE = { height_cm: 172, weight_kg: 75, age: 36, sex: 'male', training_years: 0, injury: false }

test('目录 15 组 58 项，键集与计分器完全一致', () => {
  assert.equal(OPTIONAL_GROUPS.length, 15)
  assert.equal(OPTIONAL_ITEMS.length, 58)
  const built = OPTIONAL_ITEMS.map((item) => item.key).sort()
  const official = [...BODY_OPTIONAL, ...PSYCH_OPTIONAL].sort()
  assert.deepEqual(built, official)
  assert.equal(OPTIONAL_ITEMS.filter((item) => item.side === 'body').length, 30)
  assert.equal(OPTIONAL_ITEMS.filter((item) => item.side === 'psych').length, 28)
})

test('选填只写 1 项时该项拿满 20 分', () => {
  const sessions = Array.from({ length: 7 }, (_, index) => ({
    ...emptySession(`2026-10-0${index + 1}`),
    body_required: { protein_g: 120, resistance_sets: 3, resistance_load_kg: 40 + index, overload: true },
    psych_required: { execution_likert: 5, classification: 'kept_and_changed' },
    optional: { 睡眠时长: { hours: 8 } },
  }))
  const result = scorePayload({ profile: PROFILE, sessions }) as any
  assert.equal(result.scores.body_optional.score, 20)
  assert.equal(result.scores.body_optional.items.length, 1)
  assert.equal(result.scores.body_optional.items[0].item, '睡眠时长')
})

test('选填写 4 项时按 20/4 平分', () => {
  const sessions = Array.from({ length: 7 }, (_, index) => ({
    ...emptySession(`2026-10-0${index + 1}`),
    body_required: { protein_g: 120, resistance_sets: 3, resistance_load_kg: 40 + index, overload: true },
    psych_required: { execution_likert: 5, classification: 'kept_and_changed' },
    optional: { 作息节律: 5, 三餐规律: 5, 睡眠深度: 5, 进食习惯: 5 },
  }))
  const result = scorePayload({ profile: PROFILE, sessions }) as any
  assert.equal(result.scores.body_optional.items.length, 4)
  for (const item of result.scores.body_optional.items) assert.equal(item.points, 5)
  assert.equal(result.scores.body_optional.score, 20)
})

test('选填全空是「无法评分」，不是 0 分', () => {
  const sessions = Array.from({ length: 7 }, (_, index) => ({
    ...emptySession(`2026-10-0${index + 1}`),
    body_required: { protein_g: 120, resistance_sets: 3, resistance_load_kg: 40 + index, overload: true },
    psych_required: { execution_likert: 5, classification: 'kept_and_changed' },
    optional: {},
  }))
  const result = scorePayload({ profile: PROFILE, sessions }) as any
  assert.equal(result.scores.body_optional.status, '无法评分')
  assert.equal(result.scores.body_optional.score, null)
  assert.equal(result.scores.body.status, '不合成')
})

test('submitOptional 只写白名单键，忽略未知键', async () => {
  await withStore(async (store, service) => {
    await service.submitOptional({
      date: '2026-10-01',
      items: { 作息节律: 4, 目标感: 5, 不存在的键: 9 },
    })
    const session = await store.readSession('2026-10-01')
    assert.ok(session)
    const optional = session!.optional as Record<string, unknown>
    assert.equal(optional['作息节律'], 4)
    assert.equal(optional['目标感'], 5)
    assert.equal(optional['不存在的键'], undefined)
  })
})

test('submitOptional 用 null 清除某一项', async () => {
  await withStore(async (store, service) => {
    await service.submitOptional({ date: '2026-10-01', items: { 作息节律: 4, 目标感: 5 } })
    await service.submitOptional({ date: '2026-10-01', items: { 作息节律: null } })
    const session = await store.readSession('2026-10-01')
    const optional = session!.optional as Record<string, unknown>
    assert.equal(optional['作息节律'], undefined)
    assert.equal(optional['目标感'], 5)
  })
})

test('越界标准：未确认不保存，确认后保存并写审计日志', async () => {
  await withStore(async (store, service, root) => {
    await service.saveProfile(PROFILE)
    const refused = await service.saveTargets({ protein_g_per_kg: 3, resistance_sessions_per_7d: 1 })
    assert.equal(refused.saved, false)
    assert.equal(refused.outOfRange, true)

    const saved = await service.saveTargets({ protein_g_per_kg: 3, resistance_sessions_per_7d: 1, confirm: true })
    assert.equal(saved.saved, true)
    assert.equal(saved.log?.source, 'user_outside_literature')

    const logText = await readFile(join(root, 'settings', 'log.jsonl'), 'utf8')
    assert.ok(logText.includes('超出文献范围，按用户自定义计分'))
    const log = await store.readStandardLog()
    assert.equal(log.length, 1)
    assert.equal((log[0].to as Record<string, unknown>).protein_g_per_kg, 3)
  })
})

test('范围内标准不需要确认，来源标为 within_literature', async () => {
  await withStore(async (_store, service) => {
    await service.saveProfile(PROFILE)
    const result = await service.saveTargets({ protein_g_per_kg: 1.8, resistance_sessions_per_7d: 4 })
    assert.equal(result.saved, true)
    assert.equal(result.outOfRange, false)
    assert.equal(result.log?.source, 'user_within_literature')
  })
})

test('删除单日只删该日，其他日期保留', async () => {
  await withStore(async (store, service) => {
    await service.submitText({ text: '蛋白质120g，抗阻45分钟，加了重量，状态4分，听取建议', date: '2026-10-01' })
    await service.submitText({ text: '蛋白质130g，抗阻40分钟，加了重量，状态5分，听取建议', date: '2026-10-02' })
    const removed = await store.deleteSession('2026-10-01')
    assert.deepEqual(removed, ['2026-10-01.json'])
    const sessions = await store.loadSessions()
    assert.equal(sessions.length, 1)
    assert.equal(sessions[0].date, '2026-10-02')
  })
})

test('红旗专用只写日期与红旗，不写营养与训练', async () => {
  await withStore(async (store, service) => {
    await service.submitFlagOnly({ date: '2026-10-03', flags: ['胸痛'] })
    const session = await store.readSession('2026-10-03')
    assert.deepEqual(session!.red_flags, ['胸痛'])
    assert.deepEqual(session!.body_required, {})
    assert.deepEqual(session!.psych_required, {})
  })
})

test('overview 报告选填进度', async () => {
  await withStore(async (_store, service) => {
    await service.saveProfile(PROFILE)
    await service.submitOptional({ date: '2026-10-01', items: { 作息节律: 4, 目标感: 5 } })
    const overview = await service.overview('2026-10-01')
    assert.equal(overview.optional.bodyCount, 1)
    assert.equal(overview.optional.psychCount, 1)
    assert.equal(overview.optional.written['作息节律'], 4)
  })
})

test('导出 CSV 含表头与记录行', async () => {
  await withStore(async (_store, service) => {
    await service.saveProfile(PROFILE)
    await service.submitText({ text: '蛋白质120g，抗阻45分钟，加了重量，状态4分', date: '2026-10-01' })
    const csv = await service.exportAll('csv')
    assert.equal(csv.contentType.startsWith('text/csv'), true)
    const lines = csv.body.trim().split('\n')
    assert.equal(lines[0].startsWith('date,'), true)
    assert.equal(lines.length, 2)
    const json = await service.exportAll('json')
    const parsed = JSON.parse(json.body) as { sessions: unknown[]; score: { mode: string } }
    assert.equal(parsed.sessions.length, 1)
    assert.ok(parsed.score.mode)
  })
})
