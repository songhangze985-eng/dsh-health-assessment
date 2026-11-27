/**
 * 表格与自然语言的规则提取：上游 `_heuristic_extract`、`parse_health_table_bytes`
 * 与列名映射的移植。
 *
 * 这里只做「把已经写下的东西读成结构化字段」，不算分、不补数字。模型抽取在
 * host 侧另有一层，失败时回落到本文件，因此这里的输出必须是确定的。
 *
 * @module dsh-health-assessment/src/core/extract
 */

import { collectRedFlagDetails } from './score.js'
import type { SessionRecord } from './types.js'

/** 表格列名 → 规范字段（与上游 `COLUMN_ALIASES` 一致）。 */
export const COLUMN_ALIASES: Record<string, readonly string[]> = {
  date: ['记录日期', '日期', 'date', 'start_time'],
  sleep_hours: ['总睡眠时长', '睡眠时长', '睡眠(小时)', 'sleep_duration', 'sleep_hours', 'sleep_quality'],
  steps: ['今日步数', '日常步数', '步数', 'step_count', 'steps', 'cardio_activity'],
  resting_hr: ['静息心率', '平均心率', 'resting_heart_rate', 'resting_hr', 'vital_signs'],
  resistance_minutes: ['无氧训练(分钟)', '抗阻时长', '力量训练', 'strength_training', 'resistance_minutes'],
  resistance_done: ['是否抗阻', '抗阻完成', 'resistance_done'],
  protein_g: ['蛋白质(g)', '蛋白质', 'protein_g', 'protein'],
  progressive_overload: ['渐进超负荷', '超负荷', 'progressive_overload'],
  self_rating: ['执行力自评', '心情评分', '自评', 'self_rating_1_to_5'],
  feedback_category: ['评价分类', 'feedback_category'],
  anti_inflammatory_diet: ['抗炎饮食', 'anti_inflammatory_diet'],
  stress_relief: ['压力缓解', 'stress_relief'],
  focus_state: ['专注力状态', '专注力', 'focus_state'],
}

/** 允许写进 `feedback_category` 的分类。 */
export const VALID_FEEDBACK = new Set(['kept_and_changed', 'discarded_insult', 'invalid'])

/** 表格行：列名 → 原始单元格。 */
export type TableRow = Record<string, unknown>

/** 命中列名：取最长匹配，避免「睡眠」误吞「睡眠时长」。 */
export function matchColumn(header: string): string | null {
  const cleaned = header.trim().toLowerCase()
  let best: string | null = null
  let bestLength = -1
  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const needle = alias.toLowerCase()
      if (cleaned.includes(needle) && needle.length > bestLength) {
        best = canonical
        bestLength = needle.length
      }
    }
  }
  return best
}

/** 单元格转布尔；认不出的返回 null。 */
export function asBool(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  const text = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'y', '是', '完成', '有'].includes(text)) return true
  if (['0', 'false', 'no', 'n', '否', '没有', '无'].includes(text)) return false
  return null
}

/** 单元格转数字；去掉千分位与单位后解析。 */
export function asFloat(value: unknown): number | null {
  if (typeof value === 'boolean' || value === null || value === undefined) return null
  if (typeof value === 'number') return value
  const text = String(value).trim().replace(/[,，]/g, '').replace(/[^0-9.\-]/g, '')
  if (text === '' || text === '-' || text === '.' || text === '-.') return null
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : null
}

/** 单元格转 `YYYY-MM-DD`；认不出时用默认日期。 */
export function asDate(value: unknown, defaultDate?: string | null): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  const text = String(value ?? '').trim()
  if (text.length >= 10 && text[4] === '-' && text[7] === '-') return text.slice(0, 10)
  return defaultDate || new Date().toISOString().slice(0, 10)
}

/** 选填的 0–1 比例换算，与上游 `_store_scaled_optional` 同口径。 */
function storeScaledOptional(
  optional: Record<string, unknown>,
  english: string,
  chinese: string,
  value: unknown,
): void {
  const number = asFloat(value)
  if (number === null) return
  if (number > 1 && number <= 5) {
    optional[chinese] = number
    optional[english] = r3(number / 5)
    return
  }
  const ratio = Math.min(Math.max(number, 0), 1)
  optional[english] = r3(ratio)
  optional[chinese] = { actual: ratio, target: 1 }
}

/** 三位小数（与 Python `round(x, 3)` 在常见取值上一致）。 */
function r3(value: number): number {
  return Math.round(value * 1000) / 1000
}

/**
 * 表格行 → 按日期合并的打卡记录。
 *
 * 同一张表里同一天多行会合并成一条；列名不认识的单元格直接丢弃，不猜。
 */
export function rowsToSessions(rows: TableRow[], defaultDate?: string | null): SessionRecord[] {
  const sessions = new Map<string, SessionRecord>()
  for (const rawRow of rows) {
    const mapped: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(rawRow)) {
      if (!key || value === null || value === undefined || String(value).trim() === '') continue
      const canonical = matchColumn(key)
      if (canonical) mapped[canonical] = value
    }
    if (Object.keys(mapped).length === 0) continue
    const dateStr = asDate(mapped.date, defaultDate)
    let session = sessions.get(dateStr)
    if (!session) {
      session = {
        date: dateStr,
        body_required: {},
        psych_required: {},
        optional: {},
      } as SessionRecord
      sessions.set(dateStr, session)
    }
    const body = session.body_required as Record<string, unknown>
    const psych = session.psych_required as Record<string, unknown>
    const optional = session.optional as Record<string, unknown>
    const minutes = asFloat(mapped.resistance_minutes)
    if (minutes !== null) {
      body.resistance_minutes = minutes
      body.resistance_done = minutes >= 20
    } else if ('resistance_done' in mapped) {
      const done = asBool(mapped.resistance_done)
      if (done !== null) body.resistance_done = done
    }
    const protein = asFloat(mapped.protein_g)
    if (protein !== null) body.protein_g = protein
    if ('progressive_overload' in mapped) {
      const overload = asBool(mapped.progressive_overload)
      if (overload !== null) body.progressive_overload = overload
    }
    const rating = asFloat(mapped.self_rating)
    if (rating !== null && rating >= 1 && rating <= 5) psych.self_rating_1_to_5 = rating
    const feedback = String(mapped.feedback_category ?? '').trim()
    if (VALID_FEEDBACK.has(feedback)) psych.feedback_category = feedback
    storeScaledOptional(optional, 'anti_inflammatory_diet', '饮食质量', mapped.anti_inflammatory_diet)
    storeScaledOptional(optional, 'stress_relief', '日常压力', mapped.stress_relief)
    storeScaledOptional(optional, 'focus_state', '注意力', mapped.focus_state)
    const sleepHours = asFloat(mapped.sleep_hours)
    if (sleepHours !== null) {
      optional['睡眠时长'] = { hours: sleepHours }
      optional.sleep_quality = r3(Math.min(Math.max(sleepHours / 7.5, 0), 1))
    }
    const steps = asFloat(mapped.steps)
    if (steps !== null) {
      optional['日常步数'] = { actual: steps, target: 8000 }
      optional.cardio_activity = r3(Math.min(Math.max(steps / 8000, 0), 1))
    }
    const heartRate = asFloat(mapped.resting_hr)
    if (heartRate !== null) {
      const ratio = heartRate >= 48 && heartRate <= 75
        ? 1
        : r3(Math.max(1 - (heartRate - 75) / 40, 0.2))
      optional['基础机能'] = { actual: ratio, target: 1 }
      optional.vital_signs = ratio
    }
  }
  return [...sessions.values()]
}

/** 文本里出现「练了/抗阻/力量训练」等词。 */
const TRAINED = /练了?(腿|胸|背)|撸铁|抗阻|力量训练|深蹲|卧推|硬拉/

/**
 * 规则提取：把一句中文自述读成结构化打卡。
 *
 * 与上游同口径——只认写明的数字与词，认不出就不写；`red_flags` 先留空，
 * 由 `attachKnownFlags` 再扫一遍文本。
 */
export function heuristicExtract(text: string, targetDate: string): SessionRecord {
  const body: Record<string, unknown> = {}
  const psych: Record<string, unknown> = {}
  const optional: Record<string, unknown> = {}
  const protein = /蛋白(?:质)?\s*[:：约]?\s*(\d+(?:\.\d+)?)\s*(?:g|克)?/i.exec(text)
  if (protein) body.protein_g = Number(protein[1])
  const minutes = /(?:力量训练|抗阻|练了)\s*(\d+(?:\.\d+)?)\s*分钟/.exec(text)
  if (minutes) {
    body.resistance_minutes = Number(minutes[1])
    body.resistance_done = Number(minutes[1]) >= 20
  } else if (TRAINED.test(text)) {
    body.resistance_done = true
  } else if (['没练', '休息日', '未训练'].some((word) => text.includes(word))) {
    body.resistance_done = false
  }
  if (/超负荷|加了?重量|破纪录|PR|多做了一组|加重/.test(text)) body.progressive_overload = true
  const rating = /(?:状态|心情|执行力|自评)\s*[:：打]?\s*([1-5](?:\.\d+)?)\s*分?/.exec(text)
  if (rating) psych.self_rating_1_to_5 = Number(rating[1])
  if (['听取建议', '改了', '采纳', '复盘改进', 'kept_and_changed'].some((word) => text.includes(word))) {
    psych.feedback_category = 'kept_and_changed'
  } else if (['无视喷子', '左耳进右耳出', '不内耗', '屏蔽恶意', 'discarded_insult'].some((word) => text.includes(word))) {
    psych.feedback_category = 'discarded_insult'
  } else if (['内耗', '钻牛角尖', 'invalid'].some((word) => text.includes(word))) {
    psych.feedback_category = 'invalid'
  }
  const sleep = /睡了?\s*(\d+(?:\.\d+)?)\s*小时/.exec(text)
  if (sleep) {
    const hours = Number(sleep[1])
    optional['睡眠时长'] = { hours }
    optional.sleep_quality = r3(Math.min(hours / 7.5, 1))
  }
  if (['抗炎', '深海鱼', '蓝莓', '西兰花', '少油少糖', '沙拉'].some((word) => text.includes(word))) {
    optional.anti_inflammatory_diet = 1
    optional['饮食质量'] = 5
  }
  if (['压力缓解', '放松了', '不焦虑', '冥想'].some((word) => text.includes(word))) {
    optional.stress_relief = 1
    optional['日常压力'] = 5
  }
  if (['很专注', '专注力好', '注意力集中'].some((word) => text.includes(word))) {
    optional.focus_state = 1
    optional['注意力'] = 5
  }
  return {
    date: targetDate,
    raw_text: text,
    red_flags: [],
    body_required: body,
    psych_required: psych,
    optional,
  } as SessionRecord
}

/** 把文本里扫到的红旗补进 `red_flags`（不重复）。 */
export function attachKnownFlags(session: SessionRecord): SessionRecord {
  const flags = (session.red_flags || []).map((flag) => String(flag)).filter((flag) => flag.trim() !== '')
  for (const item of collectRedFlagDetails([session])) {
    if (!flags.includes(item.flag)) flags.push(item.flag)
  }
  session.red_flags = flags
  return session
}
