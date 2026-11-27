/**
 * 面板与宿主路由之间的最小客户端。
 *
 * 同源请求，沿用 DSH GUI 的登录态；不拼接端口、不发绝对地址。
 *
 * @module dsh-health-assessment/src/client/api
 */

/** 与宿主侧一致的路由前缀。 */
const PREFIX = '/health-assessment-8221'

/** 读 JSON；非 2xx 抛出带后端文案的错误。 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${PREFIX}${path}`, {
    credentials: 'same-origin',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })
  const text = await response.text()
  const payload = text ? JSON.parse(text) : {}
  if (!response.ok) {
    throw new Error((payload as { error?: string }).error || `请求失败：${response.status}`)
  }
  return payload as T
}

/** 今日总览。 */
export interface Overview {
  date: string
  profile: Record<string, unknown>
  profileMissing: string[]
  daily: {
    target_date: string
    required_completion_ratio: number
    missing_required_fields: string[]
    recorded_optional_fields: string[]
  }
  score: Record<string, any>
  distinctDates: number
  redFlags: string[]
  settings: Record<string, any>
}

/** 一条打卡记录。 */
export interface SessionItem {
  date: string
  body_required?: Record<string, unknown>
  psych_required?: Record<string, unknown>
  optional?: Record<string, unknown>
  sources?: string[]
}

/** 面板用到的全部接口。 */
export const api = {
  overview: () => request<Overview>('/overview'),
  score: () => request<Record<string, any>>('/score'),
  sessions: () => request<SessionItem[]>('/sessions?limit=60'),
  profile: () => request<{ profile: Record<string, unknown>; score: Record<string, any> }>('/profile'),
  saveProfile: (profile: Record<string, unknown>) =>
    request<{ profile: Record<string, unknown>; score: Record<string, any> }>('/profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    }),
  checkinText: (text: string, date?: string) =>
    request<{ session: SessionItem; source: string; warning: string }>('/checkin/text', {
      method: 'POST',
      body: JSON.stringify({ text, date }),
    }),
  checkinTable: (payload: { csv?: string; rows?: Record<string, unknown>[]; filename?: string; date?: string }) =>
    request<{ imported: number; redFlags: string[] }>('/checkin/table', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  checkinImage: (payload: { base64: string; mediaType: string; name?: string; date?: string; note?: string }) =>
    request<{ session: SessionItem; source: string }>('/checkin/image', {
      method: 'POST',
      body: JSON.stringify({ ...payload, confirmed: true }),
    }),
  settings: () => request<Record<string, unknown>>('/settings'),
  saveSettings: (patch: Record<string, unknown>) =>
    request<Record<string, unknown>>('/settings', { method: 'POST', body: JSON.stringify(patch) }),
  importLibrary: (sourceRoot: string) =>
    request<{ imported: number; skipped: number }>('/import', {
      method: 'POST',
      body: JSON.stringify({ sourceRoot }),
    }),
  followUp: () => request<Record<string, any>>('/followup'),
  markReply: () => request<{ ok: boolean }>('/followup/reply', { method: 'POST', body: '{}' }),
  ackPet: () => request<{ ok: boolean }>('/pet/ack', { method: 'POST', body: '{}' }),
  say: (text: string) => request<{ ok: boolean }>('/pet/say', { method: 'POST', body: JSON.stringify({ text }) }),
}

export { PREFIX as HEALTH_API_PREFIX }
