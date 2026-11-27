/**
 * 健康评估主界面（React 组件）。
 *
 * 结构：顶部一行紧凑 Header（标题 + 共享日期 + 视图切换 + 状态 + 刷新 + 齿轮），
 * 下方主视图按 65/35 分成「打卡 + 待补」与「评估 + 趋势」；设置收进右侧抽屉。
 *
 * 约束（来自产品要求）：
 * - 不出现任何 snake_case 字段名或内部状态码，界面只说人话；
 * - 日期只有一个来源 `date`，标题、打卡、待补项共用；
 * - CSV 导入不常驻，收进「历史与导入」；
 * - 设置不常驻，点齿轮以抽屉打开。
 *
 * @module dsh-health-assessment/src/client/health
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

/** 接口前缀。 */
const PREFIX = '/health-assessment-8221'

/** 顶层视图。 */
type View = 'main' | 'history'

/** 今日清单项。 */
interface ChecklistItem {
  key: string
  label: string
  hint: string
  done: boolean
}

/** 总览结构（只声明用到的字段）。 */
interface Overview {
  date: string
  distinctDates: number
  redFlags: string[]
  checklist: ChecklistItem[]
  daily: { required_completion_ratio: number; missing_required_fields: string[] }
  score: {
    mode: string
    label?: string
    distinct_dates?: number
    calendar_span_days?: number
    scores?: {
      total?: { score?: number | null }
      body?: { score?: number | null }
      psych?: { score?: number | null }
      body_required?: { parts?: Record<string, number> }
      psych_required?: { execution?: number | null; classification?: number | null }
    }
    conclusion?: Record<string, string>
    next_steps?: string[]
  }
  settings: Record<string, unknown>
  profile: Record<string, unknown>
}

/** 一条打卡记录。 */
interface SessionItem {
  date: string
  body_required?: Record<string, unknown>
  psych_required?: Record<string, unknown>
}

/** 今天（本地时区）。 */
function today(): string {
  const now = new Date()
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** 读 JSON；非 2xx 抛后端文案。 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${PREFIX}${path}`, {
    credentials: 'same-origin',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })
  const text = await response.text()
  const payload = text ? JSON.parse(text) : {}
  if (!response.ok) throw new Error((payload as { error?: string }).error || `请求失败：${response.status}`)
  return payload as T
}

/** 把评分模式翻译成人话。 */
function modeText(overview: Overview | null): string {
  if (!overview) return ''
  const mode = overview.score.mode
  const missing = overview.checklist.filter((item) => !item.done).length
  const days = overview.distinctDates
  if (mode === 'redflag') return '记录里有需要马上处理的信号，本轮不打分，先联系医疗或当地紧急帮助。'
  if (mode === 'blocked_profile') return '档案还没填完，补齐身高体重等六项后才会生成评分。'
  if (mode === 'under7' || days < 7) return `已记录 ${days}/7 天，今天还差 ${missing} 项必填，补齐后生成评分。`
  return `七天窗口已满，评分见右侧指标。`
}

/** 14 天热力格的档位。 */
function heatLevel(hits: number): number {
  if (hits <= 0) return 0
  if (hits >= 5) return 4
  if (hits >= 3) return 3
  if (hits >= 2) return 2
  return 1
}

/** 主界面。 */
export function HealthView() {
  const [date, setDate] = useState(today())
  const [view, setView] = useState<View>('main')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [text, setText] = useState('')
  const [csv, setCsv] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [drawer, setDrawer] = useState(false)
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [connected, setConnected] = useState(false)

  /** 拉数据；日期变就重拉。 */
  const load = useCallback(async (): Promise<void> => {
    try {
      const [next, history] = await Promise.all([
        request<Overview>(`/overview?date=${date}`),
        request<SessionItem[]>('/sessions?limit=60'),
      ])
      setOverview(next)
      setSettings(next.settings ?? {})
      setSessions(history)
      setConnected(true)
      setError('')
    } catch (cause) {
      setConnected(false)
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [date])

  useEffect(() => {
    void load()
  }, [load])

  // 抽屉打开时，Esc 关闭。
  useEffect(() => {
    if (!drawer) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setDrawer(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawer])

  const flash = (message: string): void => {
    setNotice(message)
    setTimeout(() => setNotice(''), 3600)
  }

  /** 打卡。 */
  const submit = async (): Promise<void> => {
    if (!text.trim() || busy) return
    setBusy(true)
    try {
      const result = await request<{ session: { date: string }; source: string; warning?: string }>('/checkin/text', {
        method: 'POST',
        body: JSON.stringify({ text, date }),
      })
      setText('')
      flash(`已记入 ${result.session.date}${result.warning ? '（' + result.warning + '）' : ''}`)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  /** 待补项点击：把提示模板补进输入框。 */
  const fill = (item: ChecklistItem): void => {
    if (item.done) return
    const snippet: Record<string, string> = {
      protein: '蛋白质120g',
      resistance: '抗阻45分钟',
      overload: '加了重量',
      rating: '状态4分',
      feedback: '听取建议',
    }
    const piece = snippet[item.key] ?? item.label
    setText((current) => (current.includes(piece) ? current : `${current}${current ? '，' : ''}${piece}`))
  }

  /** 导入 CSV。 */
  const importCsv = async (): Promise<void> => {
    if (!csv.trim() || busy) return
    setBusy(true)
    try {
      const result = await request<{ imported: number }>('/checkin/table', {
        method: 'POST',
        body: JSON.stringify({ csv, date }),
      })
      setCsv('')
      flash(`已导入 ${result.imported} 天`)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  /** 保存设置。 */
  const saveSettings = async (): Promise<void> => {
    setBusy(true)
    try {
      await request('/settings', { method: 'POST', body: JSON.stringify(settings) })
      flash('设置已保存')
      setDrawer(false)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const checklist = overview?.checklist ?? []
  const doneCount = checklist.filter((item) => item.done).length
  const ratio = checklist.length > 0 ? doneCount / checklist.length : 0
  const scores = overview?.score.scores
  const metric = (value: number | null | undefined): string =>
    value === null || value === undefined ? '—' : String(Math.round(value))

  /** 最近 14 天的命中数。 */
  const heat = useMemo(() => {
    const map = new Map<string, number>()
    for (const session of sessions) {
      let hits = 0
      const body = session.body_required ?? {}
      const psych = session.psych_required ?? {}
      if (body.protein_g !== undefined && body.protein_g !== null) hits += 1
      if (body.resistance_done === true) hits += 1
      if (body.progressive_overload === true) hits += 1
      if (psych.self_rating_1_to_5 !== undefined || psych.execution_likert !== undefined) hits += 1
      if (psych.classification || psych.feedback_category) hits += 1
      map.set(session.date, hits)
    }
    const days: { date: string; hits: number }[] = []
    const todayDate = new Date()
    for (let i = 13; i >= 0; i -= 1) {
      const day = new Date(todayDate.getTime() - i * 86_400_000)
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
      days.push({ date: key, hits: map.get(key) ?? 0 })
    }
    return days
  }, [sessions])

  return (
    <div className="ha-root">
      <header className="ha-header">
        <span className="ha-title">健康评估</span>
        <input
          className="ha-date"
          type="date"
          value={date}
          max={today()}
          onChange={(event) => setDate(event.target.value || today())}
        />
        <div className="ha-switch">
          <button data-active={view === 'main'} onClick={() => setView('main')}>打卡与评估</button>
          <button data-active={view === 'history'} onClick={() => setView('history')}>历史与导入</button>
        </div>
        <span className="ha-grow" />
        <span className={`ha-dot${connected ? ' ok' : ''}`} title={connected ? '已连接' : '未连接'} />
        <button className="ha-icon" title="刷新" onClick={() => void load()}>⟳</button>
        <button className="ha-icon" title="设置" onClick={() => setDrawer(true)}>⚙</button>
      </header>

      {error ? <div className="ha-banner err">{error}</div> : null}
      {notice ? <div className="ha-banner ok">{notice}</div> : null}

      {view === 'main' ? (
        <div className="ha-main">
          <section className="ha-col ha-col-left">
            <div className="ha-block">
              <div className="ha-block-head">
                <span>今天的情况</span>
                <span className="ha-muted">{date}</span>
              </div>
              <textarea
                className="ha-input"
                placeholder="例如：抗阻 45 分钟加了卧推重量，蛋白质 140g，状态 5 分，听取建议不内耗"
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') void submit()
                }}
              />
              <div className="ha-actions">
                <button className="ha-primary" disabled={busy || !text.trim()} onClick={() => void submit()}>
                  {busy ? '保存中…' : '记录这一条'}
                </button>
                <span className="ha-muted">⌘ + Enter 快速提交</span>
              </div>
            </div>

            <div className="ha-block">
              <div className="ha-block-head">
                <span>今天的必填</span>
                <span className="ha-muted">{doneCount}/{checklist.length} 已完成</span>
              </div>
              <div className="ha-progress"><i style={{ width: `${ratio * 100}%` }} /></div>
              <div className="ha-list">
                {checklist.map((item) => (
                  <button
                    key={item.key}
                    className="ha-row"
                    data-done={item.done}
                    onClick={() => fill(item)}
                    title={item.done ? '' : item.hint}
                  >
                    <span className="ha-row-icon">{item.done ? '✓' : '○'}</span>
                    <span className="ha-row-label">{item.label}</span>
                    <span className="ha-row-hint">{item.done ? '' : item.hint}</span>
                    <span className={`ha-pill${item.done ? ' ok' : ''}`}>{item.done ? '已完成' : '待补'}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="ha-col ha-col-right">
            <div className="ha-block">
              <div className="ha-block-head"><span>七天评估</span></div>
              <div className="ha-metrics">
                <div className="ha-metric"><span>合计</span><strong>{metric(scores?.total?.score)}</strong><em>/200</em></div>
                <div className="ha-metric"><span>身体</span><strong>{metric(scores?.body?.score)}</strong><em>/100</em></div>
                <div className="ha-metric"><span>心理</span><strong>{metric(scores?.psych?.score)}</strong><em>/100</em></div>
              </div>
              <p className="ha-status">{modeText(overview)}</p>
              {overview?.score.next_steps?.length ? (
                <ul className="ha-steps">
                  {overview.score.next_steps.map((step) => <li key={step}>{step}</li>)}
                </ul>
              ) : null}
            </div>

            <div className="ha-block">
              <div className="ha-block-head">
                <span>最近 14 天</span>
                <span className="ha-muted">深色越满表示必填越齐</span>
              </div>
              <div className="ha-heat">
                {heat.map((day) => (
                  <div key={day.date} className={`ha-cell lv${heatLevel(day.hits)}`} title={`${day.date}：${day.hits}/5 项必填`} />
                ))}
              </div>
              <div className="ha-legend">
                <span>0</span><i className="lv0" /><i className="lv1" /><i className="lv2" /><i className="lv3" /><i className="lv4" /><span>5 项</span>
              </div>
              {heat.every((day) => day.hits === 0) ? (
                <p className="ha-empty">还没有记录。先在左边写一条，这里就会出现每天的完成情况。</p>
              ) : null}
            </div>
          </section>
        </div>
      ) : (
        <div className="ha-main">
          <section className="ha-col ha-col-left">
            <div className="ha-block">
              <div className="ha-block-head"><span>导入表格</span><span className="ha-muted">CSV，含表头</span></div>
              <textarea
                className="ha-input ha-mono"
                placeholder={'日期,蛋白质(g),无氧训练(分钟),执行力自评,评价分类\n2026-11-28,140,45,5,kept_and_changed'}
                value={csv}
                onChange={(event) => setCsv(event.target.value)}
              />
              <div className="ha-actions">
                <button className="ha-primary" disabled={busy || !csv.trim()} onClick={() => void importCsv()}>导入</button>
                <span className="ha-muted">同一天多来源会合并，穿戴记录优先</span>
              </div>
            </div>
          </section>
          <section className="ha-col ha-col-right">
            <div className="ha-block">
              <div className="ha-block-head"><span>最近记录</span><span className="ha-muted">{sessions.length} 天</span></div>
              <div className="ha-history">
                {sessions.slice(0, 30).map((session) => {
                  const body = session.body_required ?? {}
                  const psych = session.psych_required ?? {}
                  const tags: string[] = []
                  if (body.protein_g !== undefined && body.protein_g !== null) tags.push('蛋白质')
                  if (body.resistance_done === true) tags.push('抗阻')
                  if (body.progressive_overload === true) tags.push('超负荷')
                  if (psych.self_rating_1_to_5 !== undefined || psych.execution_likert !== undefined) tags.push('自评')
                  if (psych.classification || psych.feedback_category) tags.push('评价处理')
                  return (
                    <div className="ha-hrow" key={session.date}>
                      <span className="ha-mono">{session.date}</span>
                      <span className="ha-tags">
                        {tags.length > 0 ? tags.map((tag) => <span className="ha-tag" key={tag}>{tag}</span>) : <span className="ha-muted">无必填</span>}
                      </span>
                    </div>
                  )
                })}
                {sessions.length === 0 ? <p className="ha-empty">还没有记录。</p> : null}
              </div>
            </div>
          </section>
        </div>
      )}

      {drawer ? (
        <div className="ha-scrim" onClick={() => setDrawer(false)}>
          <aside className="ha-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="ha-drawer-head">
              <span>设置</span>
              <button className="ha-icon" onClick={() => setDrawer(false)}>✕</button>
            </div>
            <div className="ha-drawer-body">
              <label className="ha-field">
                <span>抽取模型 provider</span>
                <input
                  className="ha-input"
                  value={String(settings.extractionProvider ?? '')}
                  placeholder="留空沿用 DSH 当前默认模型"
                  onChange={(event) => setSettings((current) => ({ ...current, extractionProvider: event.target.value }))}
                />
              </label>
              <label className="ha-field">
                <span>模型 model</span>
                <input
                  className="ha-input"
                  value={String(settings.extractionModel ?? '')}
                  placeholder="读图需要视觉模型"
                  onChange={(event) => setSettings((current) => ({ ...current, extractionModel: event.target.value }))}
                />
              </label>
              <div className="ha-divider" />
              <label className="ha-check">
                <input
                  type="checkbox"
                  checked={settings.dailyAskEnabled !== false}
                  onChange={(event) => setSettings((current) => ({ ...current, dailyAskEnabled: event.target.checked }))}
                />
                <span>每天首次打开时追问今日缺项</span>
              </label>
              <label className="ha-field">
                <span>定时追问时刻</span>
                <input
                  className="ha-input"
                  value={String(settings.dailyAskTime ?? '')}
                  placeholder="HH:MM，留空表示只在打开时"
                  onChange={(event) => setSettings((current) => ({ ...current, dailyAskTime: event.target.value }))}
                />
              </label>
              <label className="ha-field">
                <span>追问工作区</span>
                <input
                  className="ha-input"
                  value={String(settings.dailyAskWorkspace ?? '')}
                  placeholder="路径，留空用当前会话"
                  onChange={(event) => setSettings((current) => ({ ...current, dailyAskWorkspace: event.target.value }))}
                />
              </label>
              <label className="ha-field">
                <span>未回复多久后升级（小时）</span>
                <input
                  className="ha-input"
                  type="number"
                  min={1}
                  value={String(settings.escalateHours ?? 5)}
                  onChange={(event) => setSettings((current) => ({ ...current, escalateHours: Number(event.target.value) || 5 }))}
                />
              </label>
              <div className="ha-divider" />
              <label className="ha-check">
                <input
                  type="checkbox"
                  checked={settings.petEnabled !== false}
                  onChange={(event) => setSettings((current) => ({ ...current, petEnabled: event.target.checked }))}
                />
                <span>出分时让桌宠播报一次</span>
              </label>
              <label className="ha-check">
                <input
                  type="checkbox"
                  checked={settings.confirmImageUpload !== false}
                  onChange={(event) => setSettings((current) => ({ ...current, confirmImageUpload: event.target.checked }))}
                />
                <span>图片发送前需要确认</span>
              </label>
            </div>
            <div className="ha-drawer-foot">
              <button className="ha-primary" disabled={busy} onClick={() => void saveSettings()}>保存设置</button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}

/** 左栏导航图标：一颗心，尺寸随宿主传入。 */
export function HealthNavIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 13.2S2.6 10 2.6 6.5A2.9 2.9 0 0 1 8 4.9a2.9 2.9 0 0 1 5.4 1.6C13.4 10 8 13.2 8 13.2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
