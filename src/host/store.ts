/**
 * 插件自己的记忆库：`~/.dsh/health-assessment`。
 *
 * 目录形状沿用上游（`profile.json`、`sessions/YYYY-MM-DD.json`、`analyses/`），
 * 这样从旧记忆库导入时是文件级平移，不需要转换格式。写入一律「临时文件 + rename」，
 * 避免面板与工具同时写时留下半截 JSON。
 *
 * @module dsh-health-assessment/src/host/store
 */

import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

import type { ProfileRecord, SessionRecord } from '../core/types.js'

/** 身体字段的保护组：穿戴记录优先保留这些键。 */
const WEARABLE_BODY = new Set(['resistance_minutes', 'resistance_done', 'protein_g', 'protein_ratio'])
const SELF_REPORT_BODY = new Set(['progressive_overload', 'overload'])
const WEARABLE_OPTIONAL = new Set([
  'sleep_quality', 'cardio_activity', 'vital_signs', 'hydration',
  '睡眠时长', '日常步数', '基础机能', '总饮水量',
])
const SELF_REPORT_OPTIONAL = new Set([
  'stress_relief', 'focus_state', 'anti_inflammatory_diet', 'emotional_stability',
  'self_care', '日常压力', '注意力', '饮食质量', '情绪波动', '自我照顾',
])

/** 打卡来源。顺序决定同字段谁赢。 */
export type SourceType = 'self_report' | 'wearable_table' | 'image_ocr' | 'manual_form'

/** 插件设置（面板「设置」页读写）。 */
export interface HealthSettings {
  /** 抽取用的 provider；空表示沿用 DSH 当前默认模型。 */
  extractionProvider: string
  /** 抽取用的模型 id；空表示沿用 DSH 当前默认模型。 */
  extractionModel: string
  /** 每日首次打开时是否自动开新会话追问。 */
  dailyAskEnabled: boolean
  /** 每日追问的目标工作区路径；空表示当前会话工作区。 */
  dailyAskWorkspace: string
  /** 定时追问的本地时刻，`HH:MM`；空表示不定时。 */
  dailyAskTime: string
  /** 追问后多久没回复就升级追问（小时）。 */
  escalateHours: number
  /** 是否允许把气泡投喂给 dsh-pet。 */
  petEnabled: boolean
  /** 图片发送给模型前是否需要确认。 */
  confirmImageUpload: boolean
}

/** 默认设置：追问开、不排定时、5 小时升级、宠物开。 */
export const DEFAULT_SETTINGS: HealthSettings = {
  extractionProvider: '',
  extractionModel: '',
  dailyAskEnabled: true,
  dailyAskWorkspace: '',
  dailyAskTime: '',
  escalateHours: 5,
  petEnabled: true,
  confirmImageUpload: true,
}

/** 追问状态：用于「每天一次」与「5 小时未回复升级」。 */
export interface FollowUpState {
  /** 最近一次自动追问的日期 `YYYY-MM-DD`。 */
  lastAskDate: string
  /** 最近一次追问的时间戳（毫秒）。 */
  lastAskAt: number
  /** 最近一次用户在该会话里回复的时间戳（毫秒）。 */
  lastReplyAt: number
  /** 已经升级过的日期集合（每天最多升级一次）。 */
  escalatedDates: string[]
  /** 最近一次出分播报的时间戳。 */
  lastPetAt: number
  /** 上一次播报时的总分，用于「变动 ≥5 才播」。 */
  lastPetScore: number | null
  /** host 侧待投喂的气泡；client 取走后置空。 */
  pendingBubble: string
  /** 最近一次追问的结论文本（成功或失败原因），便于面板与排查。 */
  lastAskDetail: string
  /** 最近一次浏览器侧插件加载的时间戳；用来判断 client bundle 有没有执行。 */
  lastClientHello: number
}

/** 空的追问状态。 */
export const EMPTY_FOLLOW_UP: FollowUpState = {
  lastAskDate: '',
  lastAskAt: 0,
  lastReplyAt: 0,
  escalatedDates: [],
  lastPetAt: 0,
  lastPetScore: null,
  pendingBubble: '',
  lastAskDetail: '',
  lastClientHello: 0,
}

/** 本地日期 `YYYY-MM-DD`（按系统时区，不用 UTC）。 */
export function localDay(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 校验并返回合法日期字符串；非法直接抛错。 */
export function requireSessionDay(value: unknown): string {
  const text = String(value ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error('日期必须是 YYYY-MM-DD。')
  const parsed = new Date(`${text}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
    throw new Error('日期必须是 YYYY-MM-DD。')
  }
  return text
}

/** 一条空记录。 */
export function emptySession(dateStr: string): SessionRecord {
  return {
    date: dateStr,
    sources: [],
    raw_text: '',
    red_flags: [],
    body_required: {},
    psych_required: {},
    optional: {},
  } as SessionRecord
}

/** 同字段是否应保留旧值（来源优先级保护，与上游 `_keep_existing` 同义）。 */
function keepExisting(key: string, bucket: string, priorSources: Set<string>, incoming: SourceType, current: SessionRecord): boolean {
  const bag = (bucket === 'body' ? current.body_required : current.optional) as Record<string, unknown> | undefined
  if (!bag || !(key in bag) || bag[key] === null || bag[key] === undefined) return false
  if (incoming === 'self_report' && priorSources.has('wearable_table')) {
    return (bucket === 'body' ? WEARABLE_BODY : WEARABLE_OPTIONAL).has(key)
  }
  if ((incoming === 'wearable_table' || incoming === 'image_ocr') && priorSources.has('self_report')) {
    return (bucket === 'body' ? SELF_REPORT_BODY : SELF_REPORT_OPTIONAL).has(key)
  }
  if (incoming === 'image_ocr' && priorSources.has('wearable_table')) {
    return (bucket === 'body' ? WEARABLE_BODY : WEARABLE_OPTIONAL).has(key)
  }
  return false
}

/** 合并一条新记录到已有记录（同日多来源）。 */
export function mergeRecords(existing: SessionRecord, incoming: SessionRecord, sourceType: SourceType): SessionRecord {
  const dateStr = String(incoming.date || existing.date || localDay()).slice(0, 10)
  const merged: SessionRecord = existing.date ? existing : emptySession(dateStr)
  merged.date = dateStr
  const sources = new Set<string>([...(merged.sources as string[] | undefined ?? []), ...((incoming.sources as string[] | undefined) ?? []), sourceType])
  merged.sources = [...sources].sort()
  const incomingText = String(incoming.raw_text ?? '').trim()
  if (incomingText && !String(merged.raw_text ?? '').includes(incomingText)) {
    merged.raw_text = [String(merged.raw_text ?? ''), incomingText].join(' | ').replace(/^\s*\|\s*|\s*\|\s*$/g, '')
  }
  const flags = new Set<string>(((merged.red_flags as string[] | undefined) ?? []).map((flag) => String(flag)))
  for (const flag of (incoming.red_flags as string[] | undefined) ?? []) {
    if (String(flag).trim()) flags.add(String(flag).trim())
  }
  merged.red_flags = [...flags].sort()
  const priorSources = new Set(sources)
  priorSources.delete(sourceType)
  for (const [bucket, field] of [['body', 'body_required'], ['psych', 'psych_required'], ['optional', 'optional']] as const) {
    const current = { ...((merged[field] as Record<string, unknown> | undefined) ?? {}) }
    for (const [key, value] of Object.entries((incoming[field] as Record<string, unknown> | undefined) ?? {})) {
      if (value === null || value === undefined) continue
      if (bucket === 'psych') {
        if (sourceType !== 'self_report' && priorSources.has('self_report') && key in current) continue
      } else if (keepExisting(key, bucket, priorSources, sourceType, merged)) {
        continue
      }
      current[key] = value
    }
    ;(merged as Record<string, unknown>)[field] = current
  }
  return merged
}

/** 原子写：先写临时文件再 rename，失败时清掉临时文件。 */
async function atomicWrite(path: string, text: string): Promise<void> {
  await mkdir(join(path, '..'), { recursive: true })
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`
  try {
    await writeFile(tmp, text, 'utf8')
    await rename(tmp, path)
  } catch (error) {
    await rm(tmp, { force: true })
    throw error
  }
}

/** 记忆库根目录：设置覆盖 > `~/.dsh/health-assessment`。 */
export function defaultRoot(): string {
  return join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'health-assessment')
}

/**
 * 记忆库读写。
 *
 * 一个实例只服务一个目录；目录在构造时确定，运行中不再切换（单人单库）。
 */
export class HealthStore {
  /** 记忆库根目录。 */
  readonly root: string

  constructor(root: string = defaultRoot()) {
    this.root = resolve(root)
  }

  private get sessionsDir(): string {
    return join(this.root, 'sessions')
  }

  private get analysesDir(): string {
    return join(this.root, 'analyses')
  }

  private get settingsPath(): string {
    return join(this.root, 'settings.json')
  }

  private get followUpPath(): string {
    return join(this.root, 'followup.json')
  }

  /** 建目录，幂等。 */
  async ensure(): Promise<void> {
    await mkdir(this.sessionsDir, { recursive: true })
    await mkdir(this.analysesDir, { recursive: true })
  }

  /** 读档案；文件不存在返回空对象。 */
  async loadProfile(): Promise<ProfileRecord> {
    for (const path of [join(this.root, 'profile.json'), join(this.root, 'settings', 'config.json')]) {
      try {
        const raw = await readFile(path, 'utf8')
        const parsed = JSON.parse(raw) as Record<string, unknown>
        if (!parsed || typeof parsed !== 'object') continue
        if (parsed.profile && typeof parsed.profile === 'object') {
          const profile = { ...(parsed.profile as ProfileRecord) }
          if (parsed.targets && !profile.targets) profile.targets = parsed.targets as ProfileRecord['targets']
          return profile
        }
        return parsed as ProfileRecord
      } catch {
        continue
      }
    }
    return {}
  }

  /** 写档案（`profile.json` 与 `settings/config.json` 同步，兼容上游读取顺序）。 */
  async saveProfile(profile: ProfileRecord): Promise<ProfileRecord> {
    await this.ensure()
    const stored: ProfileRecord = { ...profile }
    await atomicWrite(join(this.root, 'profile.json'), JSON.stringify(stored, null, 2))
    const settingsDir = join(this.root, 'settings')
    await mkdir(settingsDir, { recursive: true })
    await atomicWrite(join(settingsDir, 'config.json'), JSON.stringify(stored, null, 2))
    return stored
  }

  /** 读一条按日期的记录。 */
  async readSession(day: string): Promise<SessionRecord | null> {
    const path = join(this.sessionsDir, `${requireSessionDay(day)}.json`)
    try {
      const parsed = JSON.parse(await readFile(path, 'utf8')) as SessionRecord
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      return null
    }
  }

  /** 读全部记录：同日多文件按来源合并，主文件为 `YYYY-MM-DD.json`。 */
  async loadSessions(): Promise<SessionRecord[]> {
    let names: string[]
    try {
      names = await readdir(this.sessionsDir)
    } catch {
      return []
    }
    const grouped = new Map<string, { name: string; data: SessionRecord }[]>()
    for (const name of names.filter((item) => item.endsWith('.json')).sort()) {
      let data: SessionRecord
      try {
        data = JSON.parse(await readFile(join(this.sessionsDir, name), 'utf8')) as SessionRecord
      } catch {
        continue
      }
      if (!data || typeof data !== 'object') continue
      const day = String(data.date || name.slice(0, 10)).slice(0, 10)
      const list = grouped.get(day) ?? []
      list.push({ name, data })
      grouped.set(day, list)
    }
    const sessions: SessionRecord[] = []
    for (const day of [...grouped.keys()].sort()) {
      const files = grouped.get(day) ?? []
      const canonicalName = `${day}.json`
      let merged = files.find((file) => file.name === canonicalName)?.data ?? emptySession(day)
      for (const file of files) {
        if (file.name === canonicalName) continue
        const sources = (file.data.sources as string[] | undefined) ?? ['self_report']
        const source = sources[sources.length - 1] as SourceType
        merged = mergeRecords(merged, file.data, source)
      }
      sessions.push(merged)
    }
    return sessions
  }

  /** 合并并保存一条记录；返回合并结果。 */
  async mergeAndSaveSession(incoming: SessionRecord, sourceType: SourceType = 'self_report'): Promise<SessionRecord> {
    await this.ensure()
    const rawDate = incoming.date
    const day = rawDate === undefined || rawDate === null || String(rawDate).trim() === ''
      ? localDay()
      : requireSessionDay(rawDate)
    const payload: SessionRecord = { ...incoming, date: day }
    const existing = (await this.readSession(day)) ?? emptySession(day)
    const merged = mergeRecords(existing, payload, sourceType)
    await atomicWrite(join(this.sessionsDir, `${day}.json`), JSON.stringify(merged, null, 2))
    return merged
  }

  /** 写一份评估快照。 */
  async writeAnalysis(day: string, payload: unknown): Promise<void> {
    await this.ensure()
    const safeDay = requireSessionDay(day)
    const stamp = new Date().toTimeString().slice(0, 8).replace(/:/g, '')
    await atomicWrite(join(this.analysesDir, `${safeDay}-${stamp}.json`), JSON.stringify(payload, null, 2))
  }

  /** 读设置；缺字段用默认值补齐。 */
  async loadSettings(): Promise<HealthSettings> {
    try {
      const parsed = JSON.parse(await readFile(this.settingsPath, 'utf8')) as Partial<HealthSettings>
      return { ...DEFAULT_SETTINGS, ...parsed }
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  }

  /** 写设置。 */
  async saveSettings(patch: Partial<HealthSettings>): Promise<HealthSettings> {
    const next = { ...(await this.loadSettings()), ...patch }
    await atomicWrite(this.settingsPath, JSON.stringify(next, null, 2))
    return next
  }

  /** 读追问状态。 */
  async loadFollowUp(): Promise<FollowUpState> {
    try {
      const parsed = JSON.parse(await readFile(this.followUpPath, 'utf8')) as Partial<FollowUpState>
      return { ...EMPTY_FOLLOW_UP, ...parsed }
    } catch {
      return { ...EMPTY_FOLLOW_UP }
    }
  }

  /** 写追问状态。 */
  async saveFollowUp(state: FollowUpState): Promise<FollowUpState> {
    await atomicWrite(this.followUpPath, JSON.stringify(state, null, 2))
    return state
  }

  /**
   * 从旧记忆库导入记录。
   *
   * 只读旧库、只写新库；同名日期文件按来源合并，不覆盖已有值。
   * @param sourceRoot - 旧记忆库根目录。
   * @returns 导入与跳过的文件数。
   */
  async importFrom(sourceRoot: string): Promise<{ imported: number; skipped: number }> {
    await this.ensure()
    const sourceDir = join(resolve(sourceRoot), 'sessions')
    let names: string[]
    try {
      names = await readdir(sourceDir)
    } catch {
      throw new Error(`旧记忆库没有 sessions 目录：${sourceDir}`)
    }
    let imported = 0
    let skipped = 0
    for (const name of names.filter((item) => item.endsWith('.json'))) {
      let data: SessionRecord
      try {
        data = JSON.parse(await readFile(join(sourceDir, name), 'utf8')) as SessionRecord
      } catch {
        skipped += 1
        continue
      }
      const day = String(data.date || name.slice(0, 10)).slice(0, 10)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
        skipped += 1
        continue
      }
      const existing = (await this.readSession(day)) ?? emptySession(day)
      const sources = (data.sources as string[] | undefined) ?? ['self_report']
      const merged = mergeRecords(existing, data, (sources[sources.length - 1] ?? 'self_report') as SourceType)
      await atomicWrite(join(this.sessionsDir, `${day}.json`), JSON.stringify(merged, null, 2))
      imported += 1
    }
    const profilePath = join(resolve(sourceRoot), 'profile.json')
    try {
      const profile = JSON.parse(await readFile(profilePath, 'utf8')) as ProfileRecord
      if (profile && typeof profile === 'object' && Object.keys(profile).length > 0) {
        const current = await this.loadProfile()
        await this.saveProfile({ ...profile, ...current })
      }
    } catch {
      // 旧库没有档案不算失败：导入入口只承诺搬记录。
    }
    return { imported, skipped }
  }
}
