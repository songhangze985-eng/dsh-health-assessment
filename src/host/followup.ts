/**
 * 每日追问与升级提醒。
 *
 * 三条规则：
 * 1. 当天首次打开（或到点）→ 在指定工作区开一个新会话，让它问今天还差什么；
 * 2. 追问后 `escalateHours` 小时仍没回复 → 再开一个会话，把话说明白；
 * 3. 出分（或分数变动 ≥5）→ 投一次宠物气泡，每天最多一次。
 *
 * 所有「今天已经做过」的事实都落在 `followup.json`，进程重启不会重复轰炸。
 *
 * @module dsh-health-assessment/src/host/followup
 */

import { randomUUID } from 'node:crypto'
import { readFile, readdir, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { zstdDecompressSync } from 'node:zlib'

import type { Context } from '@deepseek-ai/cordis'

import type { DailyProgress } from '../core/types.js'
import type { PetBridge } from './pet.js'
import type { HealthService } from './service.js'
import type { FollowUpState, HealthStore } from './store.js'
import { localDay } from './store.js'

/** 检查间隔：十分钟一次足够覆盖「打开」与「到点」两种触发。 */
const TICK_MS = 10 * 60 * 1000

/** 分数变动多少才值得播报。 */
const PET_SCORE_DELTA = 5

/** 追问文案里最多列几项缺项。 */
const MAX_GAP_ITEMS = 3

/** 追问管理器。 */
export class FollowUpManager {
  private readonly ctx: Context
  private readonly store: HealthStore
  private readonly service: HealthService
  private readonly pet: PetBridge
  private timer: ReturnType<typeof setInterval> | null = null
  private running = false

  constructor(ctx: Context, store: HealthStore, service: HealthService, pet: PetBridge) {
    this.ctx = ctx
    this.store = store
    this.service = service
    this.pet = pet
  }

  /** 启动周期检查，并立刻跑一次（覆盖「首次打开」）。 */
  start(): () => void {
    const tick = (): void => {
      void this.tick()
    }
    tick()
    this.timer = setInterval(tick, TICK_MS)
    if (typeof this.timer === 'object' && this.timer && 'unref' in this.timer) {
      ;(this.timer as { unref: () => void }).unref()
    }
    return () => {
      if (this.timer) clearInterval(this.timer)
      this.timer = null
    }
  }

  /** 一次检查：先看播报，再看追问。 */
  async tick(): Promise<void> {
    if (this.running) return
    this.running = true
    try {
      const settings = await this.service.settings()
      if (!settings.dailyAskEnabled && !settings.petEnabled) return
      const state = await this.store.loadFollowUp()
      if (settings.petEnabled) await this.maybeBroadcast(state)
      if (settings.dailyAskEnabled) await this.maybeAsk(state)
    } catch {
      // 追问是加分项：任何失败都不该冒泡到宿主日志之外。
    } finally {
      this.running = false
    }
  }

  /** 读追问状态（面板展示用）。 */
  async state(): Promise<FollowUpState & { pendingBubble: string }> {
    return this.store.loadFollowUp()
  }

  /** 记录用户已回复。 */
  async markReply(): Promise<void> {
    const state = await this.store.loadFollowUp()
    state.lastReplyAt = Date.now()
    state.pendingBubble = ''
    await this.store.saveFollowUp(state)
  }

  /** 清掉待投喂气泡（客户端已投递）。 */
  async ackPet(): Promise<void> {
    const state = await this.store.loadFollowUp()
    state.pendingBubble = ''
    await this.store.saveFollowUp(state)
  }

  /**
   * 立刻跑一次真实的今日追问（面板/诊断用）。
   *
   * 先清掉「今天已经问过」的标记，再走与定时检查完全相同的 `tick` 路径——
   * 这样返回的就是线上行为，而不是另一套只存在于诊断里的分支。
   */
  async askNow(): Promise<{ ok: boolean; detail: string; text: string; pendingBubble: string }> {
    const state = await this.store.loadFollowUp()
    state.lastAskDate = ''
    await this.store.saveFollowUp(state)
    await this.tick()
    const after = await this.store.loadFollowUp()
    const daily = await this.service.daily(localDay())
    return {
      ok: after.pendingBubble === '',
      detail: after.lastAskDetail,
      text: this.askText(daily),
      pendingBubble: after.pendingBubble,
    }
  }

  /** 手动投喂一条。 */
  async say(text: string): Promise<void> {
    await this.pet.say(text)
  }

  /**
   * 出分播报：只在「刚满 7 天」或「分数变动 ≥5」时排一条气泡。
   *
   * 这里只写 `pendingBubble`，真正投喂由浏览器侧完成——宿主不需要知道 web 端口，
   * 也避免在无 GUI 的场景里空转。
   */
  async evaluateBroadcast(): Promise<void> {
    const state = await this.store.loadFollowUp()
    await this.maybeBroadcast(state)
  }

  private async maybeBroadcast(state: FollowUpState): Promise<void> {
    const settings = await this.service.settings()
    if (!settings.petEnabled) return
    const score = await this.service.score()
    const total = (score.scores as Record<string, { score?: number | null }> | undefined)?.total?.score ?? null
    const today = localDay()
    if (total === null) return
    const dayStart = new Date(`${today}T00:00:00`).getTime()
    if (state.lastPetAt >= dayStart) return
    const changed = state.lastPetScore === null || Math.abs(total - state.lastPetScore) >= PET_SCORE_DELTA
    if (!changed) return
    state.pendingBubble = score.mode === 'scored'
      ? `满 7 天：${total}/200 分`
      : `这一窗合计 ${total}/200 分`
    state.lastPetAt = Date.now()
    state.lastPetScore = total
    await this.pet.say(state.pendingBubble)
    await this.store.saveFollowUp(state)
  }

  private async maybeAsk(state: FollowUpState): Promise<void> {
    const settings = await this.service.settings()
    const now = Date.now()
    const today = localDay()
    const askedToday = state.lastAskDate === today
    const scheduleReached = this.scheduleReached(settings.dailyAskTime)

    if (!askedToday && scheduleReached) {
      const daily = await this.service.daily(today)
      const text = this.askText(daily)
      const opened = await this.openAskSession(text, settings.dailyAskWorkspace)
      state.lastAskDate = today
      state.lastAskAt = now
      state.lastReplyAt = 0
      state.lastAskDetail = opened.detail
      if (!opened.ok) {
        state.pendingBubble = text
        if (settings.petEnabled) await this.pet.say(text)
      }
      await this.store.saveFollowUp(state)
      return
    }

    if (!askedToday || !state.lastAskAt) return
    const unanswered = state.lastReplyAt < state.lastAskAt
    const overdue = now - state.lastAskAt >= Math.max(1, settings.escalateHours) * 3600 * 1000
    if (!unanswered || !overdue || state.escalatedDates.includes(today)) return

    const daily = await this.service.daily(today)
    const text = `已经问过一次还没等到回复：${this.askText(daily, false)}`
    const opened = await this.openAskSession(text, settings.dailyAskWorkspace)
    state.escalatedDates = [...state.escalatedDates.filter((day) => day !== today), today].slice(-30)
    state.lastAskAt = now
    state.lastAskDetail = opened.detail
    if (!opened.ok) {
      state.pendingBubble = text
      if (settings.petEnabled) await this.pet.say(text)
    }
    await this.store.saveFollowUp(state)
  }

  /** `HH:MM` 是否已到；空值表示随时可问（由「首次打开」触发）。 */
  private scheduleReached(time: string): boolean {
    if (!time) return true
    const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
    if (!match) return true
    const now = new Date()
    const minutes = Number(match[1]) * 60 + Number(match[2])
    return now.getHours() * 60 + now.getMinutes() >= minutes
  }

  /** 追问文案：最多列三项缺项。 */
  private askText(daily: DailyProgress, greet = true): string {
    const missing = daily.missing_required_fields.slice(0, MAX_GAP_ITEMS)
    const prefix = greet ? '今天的健康打卡还差：' : '还差：'
    if (missing.length === 0) return '今天的必填都齐了，要不要顺手记一条选填（睡眠、压力、注意力）？'
    return `${prefix}${missing.join('；')}。用一句话告诉我今天的情况就行。`
  }

  /**
   * 判断新建会话里到底有没有消息。
   *
   * 只看「会话文件是否存在」不够：DSH 0.2.2-rc.5 上 `agents.create` 会建出
   * 一个只有 session 事件的空壳，`followup` 既不报错也不落盘。所以这里直接
   * 数事件行数，宁可多读一次磁盘，也不要把「静默失败」当成「已经追问过」。
   */
  private async sessionHasMessage(sessionId: string): Promise<boolean> {
    const found = await this.findSessionFile(sessionId)
    if (!found) return false
    try {
      const raw = zstdDecompressSync(await readFile(found)).toString('utf8').trim()
      return raw.split('\n').length > 1
    } catch {
      return false
    }
  }

  /** 在 `<DSH_HOME>/sessions/<cwd-key>/<sessionId>/session.v4.jsonl.zstd` 里找会话文件。 */
  private async findSessionFile(sessionId: string): Promise<string | null> {
    const base = join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'sessions')
    let dirs: string[]
    try {
      dirs = await readdir(base)
    } catch {
      return null
    }
    for (const dir of dirs) {
      const file = join(base, dir, sessionId, 'session.v4.jsonl.zstd')
      try {
        await readFile(file)
        return file
      } catch {
        continue
      }
    }
    return null
  }

  /**
   * 删掉「我们刚建、确认是空壳」的会话目录。
   *
   * 只删自己创建且只有一条 session 事件的目录：宁可这条路以后都用不上，
   * 也不能每天往用户的会话列表里塞一个空对话。
   */
  private async dropEmptySession(sessionId: string): Promise<void> {
    const file = await this.findSessionFile(sessionId)
    if (!file) return
    try {
      const raw = zstdDecompressSync(await readFile(file)).toString('utf8').trim()
      if (raw.split('\n').length > 1) return
    } catch {
      return
    }
    await rm(join(file, '..'), { recursive: true, force: true }).catch(() => undefined)
  }

  /**
   * 第二通道：走 UI 同源的 sessionController（createSession + prompt）。
   *
   * `agents.create` + `followup` 在 0.2.2-rc.5 上不落盘；这条通道是浏览器新建
   * 会话时用的同一条服务，语义上更接近「用户真的开了个新对话」。
   */
  private async openViaController(
    text: string,
    workspace: string,
  ): Promise<{ ok: boolean; detail: string }> {
    const ctx = this.ctx as unknown as { get?: (name: string) => unknown }
    const controller = ctx.get?.('sessionController') as
      | {
          createSession?: (request: Record<string, unknown>) => Promise<Record<string, unknown>>
          prompt?: (request: Record<string, unknown>, source: Record<string, unknown>) => Promise<unknown>
        }
      | undefined
    if (!controller?.createSession || !controller?.prompt) {
      return { ok: false, detail: '宿主没有 sessionController.createSession/prompt' }
    }
    let sessionId = ''
    try {
      const created = await controller.createSession(workspace ? { cwd: workspace } : {})
      sessionId = String(created?.sessionId ?? created?.id ?? '')
      if (!sessionId) {
        return { ok: false, detail: `createSession 返回形状异常：keys=${Object.keys(created ?? {}).join(',') || '(空)'}` }
      }
      await controller.prompt(
        { sessionId, requestId: randomUUID(), content: [{ type: 'text', text }], mode: 'queue' },
        { kind: 'user' },
      )
      await new Promise((resolve) => setTimeout(resolve, 1200))
      if (await this.sessionHasMessage(sessionId)) {
        return { ok: true, detail: `已开会话 ${sessionId} 并投递追问（sessionController 路径）` }
      }
      await this.dropEmptySession(sessionId)
      return { ok: false, detail: `sessionController 建了会话 ${sessionId} 但消息未落盘` }
    } catch (error) {
      if (sessionId) await this.dropEmptySession(sessionId)
      return {
        ok: false,
        detail: error instanceof Error ? `sessionController: ${error.name}: ${error.message}` : String(error),
      }
    }
  }

  /**
   * 开一个新会话并发一条追问。
   *
   * 用 `ctx.agents.create` + `followup`：这是宿主里唯一受支持的「新建会话并驱动」路径。
   * 拿不到 agents 服务、或创建被拒时返回 false，由调用方退回面板提示。
   */
  private async openAskSession(text: string, workspace: string): Promise<{ ok: boolean; detail: string }> {
    const ctx = this.ctx as unknown as { get?: (name: string) => unknown }
    const agents = ctx.get?.('agents') as
      | { create?: (options: Record<string, unknown>) => Promise<Record<string, unknown>> }
      | undefined
    if (!agents?.create) return { ok: false, detail: '宿主没有 agents.create（无法新建会话）' }
    const model = ctx.get?.('agentDefaultModel') as
      | { currentSelection?: () => { provider?: string; model?: string } }
      | undefined
    const selection = model?.currentSelection?.() ?? {}
    const sessionId = randomUUID()
    try {
      const handle = await agents.create({
        sessionId,
        agentOptions: selection.provider && selection.model
          ? { provider: selection.provider, model: selection.model }
          : undefined,
        cwd: workspace || undefined,
      })
      // handle 的形状随版本不同：可能是 { agent } 也可能是 Agent 本身。
      const agent = (handle.agent ?? handle) as { followup?: (input: unknown) => unknown }
      if (typeof agent.followup !== 'function') {
        return {
          ok: false,
          detail: `handle 没有 followup；keys=${Object.keys(handle).join(',') || '(空)'}`,
        }
      }
      const message = workspace ? `${text}\n（工作区：${workspace}）` : text
      await agent.followup({
        content: [{ type: 'text', text: message }],
        source: { kind: 'health-assessment' },
      })
      await new Promise((resolve) => setTimeout(resolve, 800))
      const delivered = await this.sessionHasMessage(sessionId)
      if (!delivered) {
        await this.dropEmptySession(sessionId)
        const fallback = await this.openViaController(message, workspace)
        if (fallback.ok) return fallback
        return {
          ok: false,
          detail: `agents.create 路径消息未落盘；${fallback.detail}。已降级为气泡提醒`,
        }
      }
      return { ok: true, detail: `已开会话 ${sessionId} 并投递追问` }
    } catch (error) {
      return { ok: false, detail: error instanceof Error ? `${error.name}: ${error.message}` : String(error) }
    }
  }
}
