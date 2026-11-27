/**
 * 端到端：记忆库、规则抽取、计分、多来源合并、旧库导入。
 *
 * 这些用例不碰网络与宿主：`HealthService` 的模型通道留空时按设计降级到规则，
 * 正好覆盖「离线也能打卡」这条底线。
 *
 * @module dsh-health-assessment/test/store.test
 */

import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { HealthService } from '../src/host/service.js'
import { HealthStore, mergeRecords, emptySession } from '../src/host/store.js'

/** 建一个临时库，测试结束删掉。 */
async function withStore(run: (store: HealthStore, root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'ha-store-'))
  try {
    const store = new HealthStore(root)
    await store.ensure()
    await run(store, root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('档案写入后可读回，缺字段时计分器给出 blocked_profile', async () => {
  await withStore(async (store) => {
    const service = new HealthService(store)
    const blocked = await service.score()
    assert.equal(blocked.mode, 'blocked_profile')
    await service.saveProfile({
      height_cm: 172,
      weight_kg: 75,
      age: 36,
      sex: 'male',
      training_years: 0,
      injury: false,
    })
    const profile = await service.profile()
    assert.equal(profile.height_cm, 172)
    const after = await service.score()
    assert.equal(after.mode, 'under7')
  })
})

test('一句话打卡走规则，满 7 天后能合成 200 分', async () => {
  await withStore(async (store) => {
    const service = new HealthService(store)
    await service.saveProfile({
      height_cm: 172, weight_kg: 75, age: 36, sex: 'male', training_years: 0, injury: false,
    })
    const days = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07']
    for (const day of days) {
      const result = await service.submitText({
        text: '抗阻训练45分钟加了重量，蛋白质120g，状态5分，听取建议改了动作，睡了8小时，不焦虑很专注',
        date: day,
      })
      assert.equal(result.source, 'rule')
      assert.ok(result.session.body_required)
    }
    const score = await service.score()
    assert.equal(score.mode, 'scored')
    assert.equal((score.scores as any).total.status, 'scored')
    const total = (score.scores as any).total.score
    assert.ok(total > 0 && total <= 200, `total=${total}`)
  })
})

test('红旗文本会停分并给出就医提示', async () => {
  await withStore(async (store) => {
    const service = new HealthService(store)
    await service.saveProfile({
      height_cm: 172, weight_kg: 75, age: 36, sex: 'male', training_years: 0, injury: false,
    })
    await service.submitText({ text: '今天胸痛，先停一下', date: '2026-10-01' })
    const score = await service.score()
    assert.equal(score.mode, 'redflag')
    assert.ok((score.red_flags as string[]).includes('胸痛'))
    assert.ok((score.next_steps as string[])[0].includes('就医'))
  })
})

test('否定句不会触发红旗', async () => {
  await withStore(async (store) => {
    const service = new HealthService(store)
    await service.saveProfile({
      height_cm: 172, weight_kg: 75, age: 36, sex: 'male', training_years: 0, injury: false,
    })
    await service.submitText({ text: '无胸痛，没有呼吸困难，今天状态4分', date: '2026-10-01' })
    const score = await service.score()
    assert.notEqual(score.mode, 'redflag')
  })
})

test('表格导入按列名映射，无法识别的列被丢弃', async () => {
  await withStore(async (store) => {
    const service = new HealthService(store)
    const csv = [
      '日期,蛋白质(g),无氧训练(分钟),执行力自评,评价分类,总睡眠时长,乱写列',
      '2026-10-01,120,45,5,kept_and_changed,7.5,忽略我',
      '2026-10-02,110,30,4,discarded_insult,6,忽略我',
    ].join('\n')
    const result = await service.submitTable({ csv, filename: 'watch.csv' })
    assert.equal(result.imported, 2)
    const sessions = await store.loadSessions()
    assert.equal(sessions.length, 2)
    const first = sessions[0]
    assert.equal((first.body_required as any).protein_g, 120)
    assert.equal((first.body_required as any).resistance_done, true)
    assert.equal((first.psych_required as any).feedback_category, 'kept_and_changed')
    assert.equal((first.optional as any)['睡眠时长']?.hours, 7.5)
  })
})

test('同日多来源合并：穿戴记录保留训练时长，自述覆盖超负荷', async () => {
  await withStore(async (store) => {
    await store.mergeAndSaveSession({
      date: '2026-10-01',
      body_required: { resistance_minutes: 45, resistance_done: true, progressive_overload: false },
    }, 'wearable_table')
    const merged = await store.mergeAndSaveSession({
      date: '2026-10-01',
      body_required: { resistance_minutes: 10, progressive_overload: true },
    }, 'self_report')
    const body = merged.body_required as Record<string, unknown>
    assert.equal(body.resistance_minutes, 45, '自述不应覆盖穿戴记录的训练时长')
    assert.equal(body.progressive_overload, true, '自述应覆盖穿戴记录的超负荷')
    assert.deepEqual(merged.sources, ['self_report', 'wearable_table'])
  })
})

test('合并保留双方原文与红旗（去重）', () => {
  const base = emptySession('2026-10-01')
  const first = mergeRecords(base, {
    date: '2026-10-01',
    raw_text: '第一段',
    red_flags: ['胸痛'],
    body_required: { protein_g: 120 },
  }, 'self_report')
  const second = mergeRecords(first, {
    date: '2026-10-01',
    raw_text: '第二段',
    red_flags: ['胸痛', '骨裂'],
    body_required: { protein_g: 90 },
  }, 'wearable_table')
  assert.ok(String(second.raw_text).includes('第一段'))
  assert.ok(String(second.raw_text).includes('第二段'))
  assert.deepEqual(second.red_flags, ['胸痛', '骨裂'].sort())
  // 穿戴记录作为后来来源时只受 SELF_REPORT_BODY（超负荷）保护规则约束，
  // 蛋白质不属于自述独占字段，因此按「后到覆盖」写入 90——与上游 _keep_existing 一致。
  assert.equal((second.body_required as any).protein_g, 90)
})

test('旧记忆库导入只读旧库、写入新库', async () => {
  const oldRoot = await mkdtemp(join(tmpdir(), 'ha-old-'))
  try {
    await mkdir(join(oldRoot, 'sessions'), { recursive: true })
    await writeFile(join(oldRoot, 'sessions', '2026-09-01.json'), JSON.stringify({
      date: '2026-09-01',
      body_required: { protein_g: 100 },
      psych_required: { self_rating_1_to_5: 4 },
      optional: {},
      sources: ['self_report'],
    }), 'utf8')
    const before = await readFile(join(oldRoot, 'sessions', '2026-09-01.json'), 'utf8')
    await withStore(async (store) => {
      const result = await store.importFrom(oldRoot)
      assert.equal(result.imported, 1)
      const sessions = await store.loadSessions()
      assert.equal(sessions.length, 1)
      assert.equal((sessions[0].body_required as any).protein_g, 100)
    })
    const after = await readFile(join(oldRoot, 'sessions', '2026-09-01.json'), 'utf8')
    assert.equal(before, after, '旧库文件不应被改动')
  } finally {
    await rm(oldRoot, { recursive: true, force: true })
  }
})

test('今日进度：写完五项必填后 completion 为 100%', async () => {
  await withStore(async (store) => {
    const service = new HealthService(store)
    const today = new Date().toISOString().slice(0, 10)
    await service.submitText({
      text: '抗阻训练40分钟加了重量，蛋白质130g，状态5分，听取建议',
      date: today,
    })
    const daily = await service.daily(today)
    assert.equal(daily.missing_required_fields.length, 0)
    assert.equal(daily.required_completion_ratio, 1)
  })
})
