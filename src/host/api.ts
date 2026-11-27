/**
 * 面板与宿主之间的 JSON 路由。
 *
 * 用 `ctx.webServer` 的 handler 形态（面板需要 POST），前缀独立，避免与其他插件撞路径。
 * 只挂在 DSH GUI 的同一 origin 上，浏览器沿用既有登录态；不额外开放端口。
 *
 * @module dsh-health-assessment/src/host/api
 */

import type { IncomingMessage, ServerResponse } from 'node:http'

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'

import type { ProfileRecord } from '../core/types.js'
import type { HealthService } from './service.js'
import type { HealthStore } from './store.js'

/** 路由前缀；带插件特征后缀，防止与生态里的同名插件冲突。 */
export const API_PREFIX = '/health-assessment-8221'

/** 请求体上限：面板只传文本与表格，图片单独走 12 MB。 */
const MAX_BODY = 12 * 1024 * 1024

/** 额外需要注入的宿主能力。 */
export interface ApiHooks {
  /** 手动投喂一次气泡。 */
  say?: (text: string) => Promise<void>
  /** 标记用户已回复。 */
  markReply?: () => Promise<void>
  /** 取追问状态。 */
  followUp?: () => Promise<unknown>
  /** 清掉待投喂气泡。 */
  ackPet?: () => Promise<void>
  /** 立刻追问一次并返回诊断。 */
  askNow?: () => Promise<unknown>
}

/** 读完整请求体。 */
async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > MAX_BODY) throw new Error('请求体过大。')
    chunks.push(buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}

/** 写 JSON 响应。 */
function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload, null, 2)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

/** 包装 handler：统一错误 → 400/500 JSON。 */
function wrap(fn: (req: IncomingMessage, body: string) => Promise<unknown>) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    try {
      const body = req.method === 'GET' || req.method === 'HEAD' ? '' : await readBody(req)
      const result = await fn(req, body)
      sendJson(res, 200, result ?? { ok: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      sendJson(res, 400, { error: message })
    }
  }
}

/** 解析 JSON body；空体返回空对象。 */
function jsonBody(body: string): Record<string, unknown> {
  if (!body.trim()) return {}
  const parsed = JSON.parse(body) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('请求体必须是 JSON 对象。')
  return parsed as Record<string, unknown>
}

/** 从 URL 取查询参数。 */
function query(req: IncomingMessage): URLSearchParams {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1')
  return url.searchParams
}

/**
 * 注册全部路由。
 *
 * @param ctx - 宿主上下文（需要 `webServer`）。
 * @param service - 业务门面。
 * @param store - 记忆库（日历视图直接读文件列表）。
 * @param hooks - 宠物与追问的钩子。
 * @returns 注销函数。
 */
export function registerApi(
  ctx: Context,
  service: HealthService,
  store: HealthStore,
  hooks: ApiHooks = {},
): () => void {
  const disposers: (() => void)[] = []
  const register = (path: string, handler: (req: IncomingMessage, body: string) => Promise<unknown>): void => {
    disposers.push(ctx.webServer.register({
      kind: 'prefix',
      path: `${API_PREFIX}${path}`,
      handler: wrap(handler),
    }))
  }

  register('/', async () => ({ ok: true, prefix: API_PREFIX }))

  register('/overview', async () => service.overview())

  register('/score', async (req) => {
    const params = query(req)
    const start = params.get('start')
    const end = params.get('end')
    return service.score(start || end ? { window: { start: start ?? undefined, end: end ?? undefined } } : undefined)
  })

  register('/sessions', async (req) => {
    const limit = Number(query(req).get('limit') ?? '30')
    const sessions = await store.loadSessions()
    return sessions.slice(-Math.max(1, Math.min(limit, 200))).reverse()
  })

  register('/profile', async (req, body) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return { profile: await service.profile(), score: await service.score() }
    }
    const patch = jsonBody(body) as ProfileRecord
    const current = await service.profile()
    const next: ProfileRecord = { ...current, ...patch }
    if (patch.targets) next.targets = { ...(current.targets ?? {}), ...patch.targets }
    return { profile: await service.saveProfile(next), score: await service.score() }
  })

  register('/checkin/text', async (_req, body) => {
    const input = jsonBody(body)
    const result = await service.submitText({
      text: String(input.text ?? ''),
      date: input.date ? String(input.date) : undefined,
    })
    return { ...result, daily: await service.daily(result.session.date) }
  })

  register('/checkin/table', async (_req, body) => {
    const input = jsonBody(body)
    const result = await service.submitTable({
      csv: input.csv ? String(input.csv) : undefined,
      rows: Array.isArray(input.rows) ? (input.rows as Record<string, unknown>[]) : undefined,
      filename: input.filename ? String(input.filename) : undefined,
      date: input.date ? String(input.date) : undefined,
    })
    return { ...result, daily: await service.daily() }
  })

  register('/checkin/image', async (_req, body) => {
    const input = jsonBody(body)
    if (input.confirmed !== true) {
      throw new Error('图片需要先确认再发给模型。')
    }
    const result = await service.submitImage({
      base64: String(input.base64 ?? ''),
      mediaType: String(input.mediaType ?? 'image/jpeg'),
      name: input.name ? String(input.name) : undefined,
      date: input.date ? String(input.date) : undefined,
      note: input.note ? String(input.note) : undefined,
    })
    return { ...result, daily: await service.daily(result.session.date) }
  })

  register('/settings', async (req, body) => {
    if (req.method === 'GET' || req.method === 'HEAD') return service.settings(true)
    return service.saveSettings(jsonBody(body))
  })

  register('/import', async (_req, body) => {
    const input = jsonBody(body)
    const sourceRoot = String(input.sourceRoot ?? '').trim()
    if (!sourceRoot) throw new Error('请给出旧记忆库目录。')
    return service.importLibrary(sourceRoot)
  })

  register('/followup', async () => (hooks.followUp ? hooks.followUp() : {}))

  register('/followup/ask', async () => (hooks.askNow ? hooks.askNow() : { ok: false, detail: '未接线' }))

  register('/followup/reply', async () => {
    await hooks.markReply?.()
    return { ok: true }
  })

  register('/pet/ack', async () => {
    await hooks.ackPet?.()
    return { ok: true }
  })

  register('/pet/say', async (_req, body) => {
    const input = jsonBody(body)
    const text = String(input.text ?? '').trim()
    if (!text) throw new Error('气泡内容不能为空。')
    await hooks.say?.(text)
    return { ok: true }
  })

  return () => {
    for (const dispose of disposers.reverse()) dispose()
  }
}
