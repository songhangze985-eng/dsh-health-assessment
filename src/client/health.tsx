/**
 * 健康评估主界面（React）。
 *
 * 结构：全高单页 —— 顶部单行 Header、下方 65/35 双栏、设置居中 Modal。
 * 所有图标为内联 SVG（16–18px、stroke-width 1.75），按钮统一 32×32。
 *
 * @module dsh-health-assessment/src/client/health
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const PREFIX = '/health-assessment-8221'

/* ------------------------------------------------------------------ 图标 */

/** 线性图标外壳：统一 1.75 描边与 16px 尺寸。 */
function Icon({ path, size = 16 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

const ICON = {
  refresh: 'M20 11a8 8 0 1 0-2.3 6.3M20 5v6h-6',
  gear: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z',
  attach: 'M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.7 1.7 0 0 1-2.3-2.3l7.3-7.3',
  close: 'M18 6 6 18M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  circle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8ZM14 3v5h5',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
}

/* ------------------------------------------------------------------ 类型 */

interface ChecklistItem { key: string; label: string; hint: string; done: boolean; value: string }

interface Overview {
  date: string
  distinctDates: number
  redFlags: string[]
  profileMissing: string[]
  checklist: ChecklistItem[]
  daily: { required_completion_ratio: number }
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
    next_steps?: string[]
  }
  settings: Record<string, unknown>
  profile: Record<string, unknown>
}

interface SessionItem {
  date: string
  body_required?: Record<string, unknown>
  psych_required?: Record<string, unknown>
}

interface Attachment {
  id: string
  name: string
  kind: 'csv' | 'excel' | 'image'
  status: 'ready' | 'parsing' | 'done' | 'error'
  thumb?: string
  base64: string
  mediaType: string
  message?: string
}

/* ------------------------------------------------------------------ 工具 */

function localToday(): string {
  const d = new Date()
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

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

function fileKind(name: string): Attachment['kind'] | null {
  const lower = name.toLowerCase()
  if (lower.endsWith('.csv') || lower.endsWith('.txt')) return 'csv'
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'excel'
  if (/\.(png|jpe?g|webp)$/.test(lower)) return 'image'
  return null
}

function readAsBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      resolve(result.includes(',') ? result.slice(result.indexOf(',') + 1) : result)
    }
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

function modeText(o: Overview | null): string {
  if (!o) return ''
  const mode = o.score.mode
  const missing = o.checklist.filter((i) => !i.done).length
  if (mode === 'redflag') return '记录里有需要马上处理的信号，本轮不打分，先联系医疗或当地紧急帮助。'
  if (mode === 'blocked_profile') return '基础档案还没填完，补齐后立刻生成评分。'
  if (o.distinctDates < 7) return `已记录 ${o.distinctDates}/7 天，今天还差 ${missing} 项必填。`
  return '七天窗口已满，评分见上方指标。'
}

function heatLevel(hits: number): number {
  if (hits <= 0) return 0
  if (hits >= 5) return 4
  if (hits >= 3) return 3
  if (hits >= 2) return 2
  return 1
}

/* ------------------------------------------------------------------ 主体 */

export function HealthView() {
  const [date, setDate] = useState(localToday())
  const [overview, setOverview] = useState<Overview | null>(null)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [busy, setBusy] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [connected, setConnected] = useState(false)
  const [dragging, setDragging] = useState(false)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [workspaces, setWorkspaces] = useState<{ path: string; name: string }[]>([])

  const [profileOpen, setProfileOpen] = useState(false)
  const [profile, setProfile] = useState<Record<string, string>>({})

  const [confirming, setConfirming] = useState<{
    kind: 'image' | 'table'
    draft?: Record<string, unknown>
    rows?: Record<string, unknown>[]
    count?: number
    warning?: string
    visionModel?: string
  } | null>(null)

  const textRef = useRef<HTMLTextAreaElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const load = useCallback(async (): Promise<void> => {
    setSpinning(true)
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
    } finally {
      setTimeout(() => setSpinning(false), 450)
    }
  }, [date])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!settingsOpen && !profileOpen && !confirming) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      setSettingsOpen(false); setProfileOpen(false); setConfirming(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settingsOpen, profileOpen, confirming])

  const flash = (message: string): void => {
    setNotice(message)
    setTimeout(() => setNotice(''), 3600)
  }

  /* ---- 附件 ---- */

  const addFiles = useCallback(async (files: File[]): Promise<void> => {
    for (const file of files) {
      const kind = fileKind(file.name)
      if (!kind) { flash(`不支持的文件：${file.name}`); continue }
      const base64 = await readAsBase64(file)
      const attachment: Attachment = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name, kind, status: 'ready', base64,
        mediaType: file.type || (kind === 'image' ? 'image/png' : 'text/csv'),
        thumb: kind === 'image' ? `data:${file.type || 'image/png'};base64,${base64}` : undefined,
      }
      setAttachments((current) => [...current, attachment])
    }
  }, [])

  const onPaste = useCallback(async (event: React.ClipboardEvent): Promise<void> => {
    const items = Array.from(event.clipboardData?.items ?? [])
    const images = items.filter((item) => item.type.startsWith('image/'))
    if (images.length === 0) return
    event.preventDefault()
    const files: File[] = []
    for (const item of images) {
      const file = item.getAsFile()
      if (file) files.push(new File([file], `粘贴的图片-${Date.now()}.png`, { type: file.type }))
    }
    await addFiles(files)
  }, [addFiles])

  const removeAttachment = (id: string): void => {
    setAttachments((current) => current.filter((item) => item.id !== id))
  }

  /* ---- 提交 ---- */

  const submit = async (): Promise<void> => {
    if (busy) return
    const hasText = text.trim().length > 0
    const pending = attachments.filter((item) => item.status === 'ready')
    if (!hasText && pending.length === 0) return
    setBusy(true)
    try {
      if (hasText) {
        await request('/checkin/text', { method: 'POST', body: JSON.stringify({ text, date }) })
        setText('')
      }
      // 逐个处理附件
      for (const attachment of pending) {
        if (attachment.kind === 'image') {
          const preview = await request<{ draft: Record<string, unknown>; warning?: string; visionModel?: string }>(
            '/checkin/image/preview',
            { method: 'POST', body: JSON.stringify({ base64: attachment.base64, mediaType: attachment.mediaType, name: attachment.name, date }) },
          )
          setConfirming({ kind: 'image', draft: preview.draft, warning: preview.warning, visionModel: preview.visionModel })
          break
        }
        const result = await request<{ rows?: Record<string, unknown>[]; imported?: number }>('/checkin/table', {
          method: 'POST',
          body: JSON.stringify({ fileBase64: attachment.base64, filename: attachment.name, date }),
        })
        void result
      }
      if (pending.every((item) => item.kind !== 'image')) {
        setAttachments((current) => current.filter((item) => !pending.includes(item)))
        flash(pending.length > 0 ? `已处理 ${pending.length} 个文件` : '已记录')
        await load()
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  /* ---- 确认写入 ---- */

  const commitDraft = async (): Promise<void> => {
    if (!confirming?.draft) return
    setBusy(true)
    try {
      await request('/checkin/commit', { method: 'POST', body: JSON.stringify({ draft: confirming.draft }) })
      setConfirming(null)
      setAttachments([])
      flash('已写入')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  /* ---- 设置 ---- */

  const openSettings = async (): Promise<void> => {
    setSettingsOpen(true)
    try {
      const result = await request<{ rows: { id?: string; path?: string; name?: string; title?: string }[] }>('/workspaces')
      setWorkspaces((result.rows || []).map((row) => ({
        path: String(row.path ?? row.id ?? ''),
        name: String(row.name ?? row.title ?? row.path ?? row.id ?? ''),
      })).filter((row) => row.path))
    } catch {
      setWorkspaces([])
    }
  }

  const saveSettings = async (): Promise<void> => {
    setBusy(true)
    try {
      await request('/settings', { method: 'POST', body: JSON.stringify(settings) })
      setSettingsOpen(false)
      flash('设置已保存')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  /* ---- 档案 ---- */

  const openProfile = (): void => {
    const p = overview?.profile ?? {}
    setProfile({
      height_cm: String(p.height_cm ?? ''), weight_kg: String(p.weight_kg ?? ''),
      age: String(p.age ?? ''), sex: String(p.sex ?? ''),
      training_years: String(p.training_years ?? ''),
      injury: p.injury === true ? '1' : '',
    })
    setProfileOpen(true)
  }

  const saveProfile = async (): Promise<void> => {
    setBusy(true)
    try {
      await request('/profile', {
        method: 'POST',
        body: JSON.stringify({
          height_cm: profile.height_cm ? Number(profile.height_cm) : null,
          weight_kg: profile.weight_kg ? Number(profile.weight_kg) : null,
          age: profile.age ? Number(profile.age) : null,
          sex: profile.sex || null,
          training_years: profile.training_years ? Number(profile.training_years) : null,
          injury: profile.injury === '1',
        }),
      })
      setProfileOpen(false)
      flash('档案已保存')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  /* ---- 派生数据 ---- */

  const checklist = overview?.checklist ?? []
  const doneCount = checklist.filter((i) => i.done).length
  const ratio = checklist.length > 0 ? doneCount / checklist.length : 0
  const scores = overview?.score.scores
  const total = scores?.total?.score ?? null

  const heat = useMemo(() => {
    const map = new Map<string, { hits: number; score: number | null }>()
    for (const s of sessions) {
      const b = s.body_required ?? {}
      const p = s.psych_required ?? {}
      let hits = 0
      if (b.protein_g !== undefined && b.protein_g !== null) hits += 1
      if (b.resistance_done === true) hits += 1
      if (b.progressive_overload === true) hits += 1
      if (p.self_rating_1_to_5 !== undefined || p.execution_likert !== undefined) hits += 1
      if (p.classification || p.feedback_category) hits += 1
      map.set(s.date, { hits, score: null })
    }
    const days: { date: string; hits: number }[] = []
    const now = new Date()
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(now.getTime() - i * 86_400_000)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      days.push({ date: key, hits: map.get(key)?.hits ?? 0 })
    }
    return days
  }, [sessions])

  const ring = 2 * Math.PI * 34
  const ringDash = ring * Math.min(1, (total ?? 0) / 200)

  return (
    <div className="ha-root">
      <header className="ha-header">
        <span className="ha-title">健康评估</span>
        <input className="ha-date" type="date" value={date} max={localToday()}
          onChange={(e) => setDate(e.target.value || localToday())} />
        <span className="ha-grow" />
        <span className={`ha-dot${connected ? ' ok' : ''}`} title={connected ? '已连接' : '未连接'} />
        <button className="ha-icon" title="刷新数据" onClick={() => void load()}>
          <span className={spinning ? 'ha-spin' : ''}><Icon path={ICON.refresh} /></span>
        </button>
        <button className="ha-icon" title="设置" onClick={() => void openSettings()}><Icon path={ICON.gear} /></button>
      </header>

      {error ? <div className="ha-banner err">{error}</div> : null}
      {notice ? <div className="ha-banner ok">{notice}</div> : null}

      <div className="ha-main">
        {/* 左：输入 + 清单 */}
        <section className="ha-col ha-col-left">
          <div className="ha-block ha-block-grow">
            <div className="ha-block-head"><span>今天的情况</span><span className="ha-muted">{date}</span></div>
            <div
              className={`ha-composer${dragging ? ' dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragging(false)
                void addFiles(Array.from(e.dataTransfer.files ?? []))
              }}
            >
              <textarea
                ref={textRef}
                className="ha-textarea"
                placeholder="例如：抗阻 45 分钟加了卧推重量，蛋白质 140g，状态 5 分，听取建议不内耗"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onPaste={(e) => void onPaste(e)}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void submit() }}
              />
              {attachments.length > 0 ? (
                <div className="ha-chips">
                  {attachments.map((item) => (
                    <div className="ha-chip" key={item.id} title={item.name}>
                      {item.thumb
                        ? <img src={item.thumb} alt="" className="ha-thumb" />
                        : <Icon path={item.kind === 'image' ? ICON.image : ICON.file} size={14} />}
                      <span className="ha-chip-name">{item.name}</span>
                      <span className={`ha-chip-state ${item.status}`}>{item.status === 'done' ? '已完成' : item.status === 'error' ? '失败' : '待解析'}</span>
                      <button className="ha-chip-x" title="移除" onClick={() => removeAttachment(item.id)}><Icon path={ICON.close} size={12} /></button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="ha-composer-bar">
                <button className="ha-icon" title="选择文件（CSV / Excel / 图片）" onClick={() => fileRef.current?.click()}>
                  <Icon path={ICON.attach} />
                </button>
                <input ref={fileRef} type="file" multiple hidden accept=".csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => { void addFiles(Array.from(e.target.files ?? [])); e.target.value = '' }} />
                <span className="ha-muted">拖入文件 · 或 ⌘V 粘贴图片 · ⌘Enter 提交</span>
                <span className="ha-grow" />
                <button className="ha-primary" disabled={busy || (!text.trim() && attachments.length === 0)} onClick={() => void submit()}>
                  {busy ? '处理中…' : '记录'}
                </button>
              </div>
            </div>
          </div>

          <div className="ha-block ha-block-grow">
            <div className="ha-block-head">
              <span>今天的必填</span>
              <span className="ha-muted">{doneCount}/{checklist.length} 已完成</span>
            </div>
            <div className="ha-progress"><i style={{ width: `${ratio * 100}%` }} /></div>
            <div className="ha-list">
              {checklist.map((item) => (
                <button key={item.key} className="ha-row" data-done={item.done}
                  onClick={() => {
                    if (item.done) return
                    const snippet: Record<string, string> = {
                      protein: '蛋白质120g', resistance: '抗阻45分钟', overload: '加了重量',
                      rating: '状态4分', feedback: '听取建议',
                    }
                    const piece = snippet[item.key] ?? item.label
                    setText((cur) => (cur.includes(piece) ? cur : `${cur}${cur ? '，' : ''}${piece}`))
                    textRef.current?.focus()
                  }}>
                  <span className="ha-row-icon">
                    <Icon path={item.done ? ICON.check : ICON.circle} size={15} />
                  </span>
                  <span className="ha-row-label">{item.label}</span>
                  <span className="ha-row-hint">{item.done ? item.value || '已记录' : item.hint}</span>
                  <span className={`ha-pill${item.done ? ' ok' : ''}`}>{item.done ? '已完成' : '待补'}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 右：仪表盘 */}
        <section className="ha-col ha-col-right">
          <div className="ha-block">
            <div className="ha-block-head"><span>七天评估</span><span className="ha-muted">{overview?.distinctDates ?? 0}/7 天</span></div>
            <div className="ha-score">
              <svg width="92" height="92" viewBox="0 0 92 92" className="ha-ring">
                <circle cx="46" cy="46" r="34" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="7" />
                <circle cx="46" cy="46" r="34" fill="none" stroke="#4faa80" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={`${ringDash} ${ring}`} transform="rotate(-90 46 46)" />
                <text x="46" y="44" textAnchor="middle" className="ha-ring-num">{total === null ? '—' : Math.round(total)}</text>
                <text x="46" y="58" textAnchor="middle" className="ha-ring-sub">/ 200</text>
              </svg>
              <div className="ha-bars">
                <div className="ha-bar-row">
                  <span className="ha-bar-label">身体</span>
                  <span className="ha-bar"><i style={{ width: `${Math.min(100, scores?.body?.score ?? 0)}%` }} /></span>
                  <span className="ha-bar-num">{scores?.body?.score === null || scores?.body?.score === undefined ? '—' : Math.round(scores.body.score)}<em>/100</em></span>
                </div>
                <div className="ha-bar-row">
                  <span className="ha-bar-label">心理</span>
                  <span className="ha-bar"><i style={{ width: `${Math.min(100, scores?.psych?.score ?? 0)}%` }} /></span>
                  <span className="ha-bar-num">{scores?.psych?.score === null || scores?.psych?.score === undefined ? '—' : Math.round(scores.psych.score)}<em>/100</em></span>
                </div>
              </div>
            </div>
            <p className="ha-status">{modeText(overview)}</p>
            {overview && overview.profileMissing.length > 0 ? (
              <button className="ha-primary ha-profile-cta" onClick={openProfile}>
                <Icon path={ICON.user} size={14} /> 立即补全基础档案
              </button>
            ) : null}
            {overview?.score.next_steps?.length ? (
              <ul className="ha-steps">{overview.score.next_steps.map((s) => <li key={s}>{s}</li>)}</ul>
            ) : null}
          </div>

          <div className="ha-block ha-block-grow">
            <div className="ha-block-head"><span>最近 14 天</span><span className="ha-muted">越满表示必填越齐</span></div>
            <div className="ha-heat">
              {heat.map((day) => (
                <button key={day.date} className={`ha-cell lv${heatLevel(day.hits)}`}
                  title={`${day.date}：${day.hits}/5 项必填`}
                  onClick={() => setDate(day.date)} />
              ))}
            </div>
            <div className="ha-ticks">
              <span>{heat[0]?.date.slice(5)}</span>
              <span>{heat[6]?.date.slice(5)}</span>
              <span>{heat[13]?.date.slice(5)}</span>
            </div>
            <div className="ha-legend">
              <span>0</span><i className="lv0" /><i className="lv1" /><i className="lv2" /><i className="lv3" /><i className="lv4" /><span>5 项</span>
            </div>
            {heat.every((d) => d.hits === 0) ? <p className="ha-empty">还没有记录，先在左边写一条。</p> : null}
          </div>
        </section>
      </div>

      {/* 设置：居中 Modal */}
      {settingsOpen ? (
        <div className="ha-scrim" onClick={() => setSettingsOpen(false)}>
          <div className="ha-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ha-modal-head">
              <span>设置</span>
              <button className="ha-icon" title="关闭" onClick={() => setSettingsOpen(false)}><Icon path={ICON.close} /></button>
            </div>
            <div className="ha-modal-body">
              <div className="ha-group">
                <div className="ha-group-title">模型与识图引擎</div>
                <label className="ha-field"><span>文本抽取模型 · provider</span>
                  <input className="ha-input" value={String(settings.extractionProvider ?? '')} placeholder="留空 = 沿用 DSH 默认"
                    onChange={(e) => setSettings((c) => ({ ...c, extractionProvider: e.target.value }))} /></label>
                <label className="ha-field"><span>文本抽取模型 · model</span>
                  <input className="ha-input" value={String(settings.extractionModel ?? '')} placeholder="留空 = 沿用 DSH 默认"
                    onChange={(e) => setSettings((c) => ({ ...c, extractionModel: e.target.value }))} /></label>
                <label className="ha-field"><span>识图通道 · provider</span>
                  <input className="ha-input" value={String(settings.visionProvider ?? '')} placeholder="留空 = 与抽取模型相同"
                    onChange={(e) => setSettings((c) => ({ ...c, visionProvider: e.target.value }))} /></label>
                <label className="ha-field"><span>识图通道 · model</span>
                  <input className="ha-input" value={String(settings.visionModel ?? '')} placeholder="留空 = 与抽取模型相同"
                    onChange={(e) => setSettings((c) => ({ ...c, visionModel: e.target.value }))} /></label>
              </div>

              <div className="ha-group">
                <div className="ha-group-title">自动追问与工作区</div>
                <label className="ha-check"><input type="checkbox" checked={settings.autoPromptOnOpen !== false}
                  onChange={(e) => setSettings((c) => ({ ...c, autoPromptOnOpen: e.target.checked }))} />
                  <span>打开 DSH 自动检测并追问（每天最多一次）</span></label>
                <label className="ha-check"><input type="checkbox" checked={settings.dailyAskEnabled !== false}
                  onChange={(e) => setSettings((c) => ({ ...c, dailyAskEnabled: e.target.checked }))} />
                  <span>定时追问今日缺项</span></label>
                <label className="ha-field"><span>追问工作区</span>
                  <select className="ha-input" value={String(settings.dailyAskWorkspace ?? '')}
                    onChange={(e) => setSettings((c) => ({ ...c, dailyAskWorkspace: e.target.value }))}>
                    <option value="">（当前会话工作区）</option>
                    {workspaces.map((w) => <option key={w.path} value={w.path}>{w.name}</option>)}
                  </select></label>
                <label className="ha-field"><span>或手动输入路径</span>
                  <input className="ha-input" value={String(settings.dailyAskWorkspace ?? '')} placeholder="/path/to/workspace"
                    onChange={(e) => setSettings((c) => ({ ...c, dailyAskWorkspace: e.target.value }))} /></label>
                <label className="ha-field"><span>定时时刻</span>
                  <input className="ha-input" value={String(settings.dailyAskTime ?? '')} placeholder="HH:MM，留空=只在打开时"
                    onChange={(e) => setSettings((c) => ({ ...c, dailyAskTime: e.target.value }))} /></label>
                <label className="ha-field"><span>未回复多久后升级（小时）</span>
                  <input className="ha-input" type="number" min={1} value={String(settings.escalateHours ?? 5)}
                    onChange={(e) => setSettings((c) => ({ ...c, escalateHours: Number(e.target.value) || 5 }))} /></label>
              </div>

              <div className="ha-group">
                <div className="ha-group-title">交互偏好</div>
                <label className="ha-check"><input type="checkbox" checked={settings.petEnabled !== false}
                  onChange={(e) => setSettings((c) => ({ ...c, petEnabled: e.target.checked }))} />
                  <span>出分时让桌宠播报一次</span></label>
                <label className="ha-check"><input type="checkbox" checked={settings.confirmImageUpload !== false}
                  onChange={(e) => setSettings((c) => ({ ...c, confirmImageUpload: e.target.checked }))} />
                  <span>图片入库前需要确认</span></label>
              </div>
            </div>
            <div className="ha-modal-foot">
              <button className="ha-ghost" onClick={() => setSettingsOpen(false)}>取消</button>
              <button className="ha-primary" disabled={busy} onClick={() => void saveSettings()}>保存设置</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 档案：轻量表单 */}
      {profileOpen ? (
        <div className="ha-scrim" onClick={() => setProfileOpen(false)}>
          <div className="ha-modal ha-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="ha-modal-head">
              <span>补全基础档案</span>
              <button className="ha-icon" title="关闭" onClick={() => setProfileOpen(false)}><Icon path={ICON.close} /></button>
            </div>
            <div className="ha-modal-body">
              <p className="ha-muted" style={{ margin: 0 }}>六项填完立刻解锁评分。缺项不会估算。</p>
              {([
                ['height_cm', '身高（cm）'], ['weight_kg', '体重（kg）'], ['age', '年龄'],
                ['training_years', '训练年限'],
              ] as [string, string][]).map(([key, label]) => (
                <label className="ha-field" key={key}><span>{label}</span>
                  <input className="ha-input" type="number" value={profile[key] ?? ''}
                    onChange={(e) => setProfile((c) => ({ ...c, [key]: e.target.value }))} /></label>
              ))}
              <label className="ha-field"><span>性别</span>
                <select className="ha-input" value={profile.sex ?? ''}
                  onChange={(e) => setProfile((c) => ({ ...c, sex: e.target.value }))}>
                  <option value="">未填</option><option value="male">male</option>
                  <option value="female">female</option><option value="other">other</option>
                </select></label>
              <label className="ha-check"><input type="checkbox" checked={profile.injury === '1'}
                onChange={(e) => setProfile((c) => ({ ...c, injury: e.target.checked ? '1' : '' }))} />
                <span>有伤病（只作备注，不因此停分）</span></label>
            </div>
            <div className="ha-modal-foot">
              <button className="ha-ghost" onClick={() => setProfileOpen(false)}>取消</button>
              <button className="ha-primary" disabled={busy} onClick={() => void saveProfile()}>保存并解锁评分</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 入库前确认 */}
      {confirming ? (
        <div className="ha-scrim" onClick={() => setConfirming(null)}>
          <div className="ha-modal ha-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="ha-modal-head">
              <span>确认写入</span>
              <button className="ha-icon" title="关闭" onClick={() => setConfirming(null)}><Icon path={ICON.close} /></button>
            </div>
            <div className="ha-modal-body">
              {confirming.warning ? <p className="ha-muted" style={{ margin: 0 }}>{confirming.warning}</p> : null}
              {confirming.visionModel ? <p className="ha-muted" style={{ margin: 0 }}>识图通道：{confirming.visionModel}</p> : null}
              <pre className="ha-pre">{JSON.stringify(confirming.draft, null, 2)}</pre>
            </div>
            <div className="ha-modal-foot">
              <button className="ha-ghost" onClick={() => setConfirming(null)}>取消</button>
              <button className="ha-primary" disabled={busy} onClick={() => void commitDraft()}>确认写入</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** 左侧导航图标。 */
export function HealthNavIcon() {
  return <Icon path={ICON.check} size={16} />
}
