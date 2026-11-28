/**
 * 健康评估主界面（React）。
 *
 * 结构：全高单页 —— 顶部单行 Header、下方 65/35 双栏、设置居中 Modal。
 * 所有图标为内联 SVG（16–18px、stroke-width 1.75），按钮统一 32×32。
 *
 * @module dsh-health-assessment/src/client/health
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { OptionalDialog } from './optional.js'

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
  optional: { written: Record<string, unknown>; bodyCount: number; psychCount: number }
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

  const [view, setView] = useState<'main' | 'history'>('main')
  const [csvText, setCsvText] = useState('')
  const [optionalOpen, setOptionalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailDate, setDetailDate] = useState('')
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [showParts, setShowParts] = useState(false)
  const [targets, setTargets] = useState<{ protein_g_per_kg: number; resistance_sessions_per_7d: number; targetProteinG: number | null } | null>(null)
  const [modelCatalog, setModelCatalog] = useState<{ id: string; name: string; models: { id: string; name: string }[] }[]>([])
  const [libraries, setLibraries] = useState<{ path: string; codename: string }[]>([])
  const [activeLibrary, setActiveLibrary] = useState('')
  const [logRows, setLogRows] = useState<Record<string, unknown>[]>([])
  const [diag, setDiag] = useState('')
  const [newLibrary, setNewLibrary] = useState('')
  const [importPath, setImportPath] = useState('')

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
    if (!settingsOpen && !profileOpen && !confirming && !optionalOpen && !detailOpen) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      setSettingsOpen(false); setProfileOpen(false); setConfirming(null)
      setOptionalOpen(false); setDetailOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settingsOpen, profileOpen, confirming, optionalOpen, detailOpen])

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
    void (async () => {
      try {
        const [t, m, l, g] = await Promise.all([
          request<{ protein_g_per_kg: number; resistance_sessions_per_7d: number; targetProteinG: number | null }>('/targets'),
          request<{ providers: { id: string; name: string; models: { id: string; name: string }[] }[] }>('/models'),
          request<{ libraries: { path: string; codename: string }[]; active: string }>('/libraries'),
          request<{ rows: Record<string, unknown>[] }>('/log'),
        ])
        setTargets(t)
        setModelCatalog(m.providers ?? [])
        setLibraries(l.libraries ?? [])
        setActiveLibrary(l.active ?? '')
        setLogRows(g.rows ?? [])
      } catch {
        // 诊断信息缺失不影响设置本身。
      }
    })()
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

  /* ---- 红旗专用 / 导出 / 诊断 ---- */

  const flagOnly = async (): Promise<void> => {
    const flags = overview?.redFlags ?? []
    if (flags.length === 0) return
    setBusy(true)
    try {
      await request('/checkin/flag-only', {
        method: 'POST',
        body: JSON.stringify({ date, flags }),
      })
      flash('已只记录这一天的红旗')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const importCsv = async (): Promise<void> => {
    if (!csvText.trim() || busy) return
    setBusy(true)
    try {
      const result = await request<{ imported: number }>('/checkin/table', {
        method: 'POST',
        body: JSON.stringify({ csv: csvText, date }),
      })
      setCsvText('')
      flash(`已导入 ${result.imported} 天`)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const download = async (format: 'csv' | 'json'): Promise<void> => {
    try {
      const result = await request<{ body: string; filename: string }>(`/export?format=${format}`)
      const blob = new Blob([result.body], { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = result.filename
      anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const runDiagnostic = async (path: string, label: string): Promise<void> => {
    setDiag(`${label}…`)
    try {
      const result = await request<Record<string, unknown>>(path, { method: 'POST', body: '{}' })
      setDiag(`${label}：${JSON.stringify(result.detail ?? result).slice(0, 220)}`)
    } catch (cause) {
      setDiag(`${label}失败：${cause instanceof Error ? cause.message : String(cause)}`)
    }
  }

  const saveTargets = async (perKg: number, per7d: number, confirm: boolean): Promise<boolean> => {
    try {
      const result = await request<{ saved: boolean; outOfRange: boolean; range: string }>('/targets', {
        method: 'POST',
        body: JSON.stringify({ protein_g_per_kg: perKg, resistance_sessions_per_7d: per7d, confirm }),
      })
      if (!result.saved) {
        flash(result.range)
        return false
      }
      flash('计分标准已保存')
      await load()
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      return false
    }
  }

  /* ---- 记忆库 ---- */

  const switchLibrary = async (path: string): Promise<void> => {
    try {
      const result = await request<{ libraries: { path: string; codename: string }[]; active: string }>('/libraries', {
        method: 'POST',
        body: JSON.stringify({ path: path || '', switch: true }),
      })
      setLibraries(result.libraries ?? [])
      setActiveLibrary(result.active ?? '')
      flash(path ? `已切到 ${path}` : '已切回默认库')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const addLibrary = async (): Promise<void> => {
    const path = newLibrary.trim()
    if (!path) return
    await switchLibrary(path)
    setNewLibrary('')
  }

  const runImport = async (): Promise<void> => {
    const path = importPath.trim()
    if (!path) return
    setBusy(true)
    try {
      const result = await request<{ imported: number; skipped: number }>('/import', {
        method: 'POST',
        body: JSON.stringify({ sourceRoot: path }),
      })
      flash(`导入 ${result.imported} 个文件，跳过 ${result.skipped} 个`)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  /* ---- 单日详情 ---- */

  const openDetail = async (day: string): Promise<void> => {
    setDetailDate(day)
    setDetailOpen(true)
    try {
      const result = await request<{ session: Record<string, unknown> | null }>(`/session?date=${day}`)
      setDetail(result.session)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const deleteDay = async (): Promise<void> => {
    if (!detailDate) return
    setBusy(true)
    try {
      await request(`/session?date=${detailDate}`, { method: 'DELETE' })
      setDetailOpen(false)
      flash(`已删除 ${detailDate}`)
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
        <div className="ha-switch">
          <button data-active={view === 'main'} onClick={() => setView('main')}>打卡与评估</button>
          <button data-active={view === 'history'} onClick={() => setView('history')}>历史与导入</button>
        </div>
        <span className="ha-grow" />
        <span className={`ha-dot${connected ? ' ok' : ''}`} title={connected ? '已连接' : '未连接'} />
        <button className="ha-icon" title="刷新数据" onClick={() => void load()}>
          <span className={spinning ? 'ha-spin' : ''}><Icon path={ICON.refresh} /></span>
        </button>
        <button className="ha-icon" title="设置" onClick={() => void openSettings()}><Icon path={ICON.gear} /></button>
      </header>

      {error ? <div className="ha-banner err">{error}</div> : null}
      {notice ? <div className="ha-banner ok">{notice}</div> : null}

      {view === 'main' ? (
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
              <span className="ha-row gap8">
                <span className="ha-muted">{doneCount}/{checklist.length} 已完成</span>
                <button className="ha-mini" onClick={() => setOptionalOpen(true)}>
                  选填 {overview ? overview.optional.bodyCount + overview.optional.psychCount : 0}/58
                </button>
              </span>
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
            <div className="ha-row gap8">
              <button className="ha-mini" onClick={() => setShowParts((v) => !v)}>
                {showParts ? '收起明细' : '查看明细'}
              </button>
              {overview && overview.redFlags.length > 0 ? (
                <button className="ha-mini" onClick={() => void flagOnly()}>只记这一天（仅红旗）</button>
              ) : null}
            </div>
            {showParts ? <PartsBreakdown overview={overview} /> : null}
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
      ) : (
      <div className="ha-main">
        <section className="ha-col ha-col-left">
          <div className="ha-block ha-block-grow">
            <div className="ha-block-head"><span>导入表格</span><span className="ha-muted">CSV 粘贴或选择文件</span></div>
            <textarea
              className="ha-textarea"
              placeholder={'日期,蛋白质(g),无氧训练(分钟),执行力自评,评价分类\n2026-11-28,140,45,5,kept_and_changed'}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
            <div className="ha-actions">
              <button className="ha-primary" disabled={busy || !csvText.trim()} onClick={() => void importCsv()}>导入 CSV</button>
              <span className="ha-muted">也可以直接拖文件到「打卡与评估」的输入区</span>
            </div>
          </div>
        </section>
        <section className="ha-col ha-col-right">
          <div className="ha-block ha-block-grow">
            <div className="ha-block-head">
              <span>最近记录</span>
              <span className="ha-row gap8">
                <span className="ha-muted">{sessions.length} 天</span>
                <button className="ha-mini" onClick={() => void download('csv')}>导出 CSV</button>
                <button className="ha-mini" onClick={() => void download('json')}>导出 JSON</button>
              </span>
            </div>
            <div className="ha-history">
              {sessions.slice(0, 60).map((session) => {
                const body = session.body_required ?? {}
                const psych = session.psych_required ?? {}
                const tags: string[] = []
                if (body.protein_g !== undefined && body.protein_g !== null) tags.push('蛋白质')
                if (body.resistance_done === true) tags.push('抗阻')
                if (body.progressive_overload === true) tags.push('超负荷')
                if (psych.self_rating_1_to_5 !== undefined || psych.execution_likert !== undefined) tags.push('自评')
                if (psych.classification || psych.feedback_category) tags.push('评价处理')
                return (
                  <button className="ha-hrow ha-hrow-btn" key={session.date} onClick={() => void openDetail(session.date)}>
                    <span className="ha-mono">{session.date}</span>
                    <span className="ha-tags">
                      {tags.length > 0
                        ? tags.map((tag) => <span className="ha-tag" key={tag}>{tag}</span>)
                        : <span className="ha-muted">无必填</span>}
                    </span>
                  </button>
                )
              })}
              {sessions.length === 0 ? <p className="ha-empty">还没有记录。</p> : null}
            </div>
          </div>
        </section>
      </div>
      )}

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
                <ModelPicker
                  label="文本抽取模型"
                  catalog={modelCatalog}
                  provider={String(settings.extractionProvider ?? '')}
                  model={String(settings.extractionModel ?? '')}
                  onChange={(provider, model) => setSettings((c) => ({ ...c, extractionProvider: provider, extractionModel: model }))}
                />
                <ModelPicker
                  label="识图通道"
                  catalog={modelCatalog}
                  provider={String(settings.visionProvider ?? '')}
                  model={String(settings.visionModel ?? '')}
                  emptyHint="留空 = 与抽取模型相同"
                  onChange={(provider, model) => setSettings((c) => ({ ...c, visionProvider: provider, visionModel: model }))}
                />
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
                <div className="ha-group-title">计分标准</div>
                <label className="ha-field"><span>蛋白质（克 / 公斤体重）</span>
                  <input className="ha-input" type="number" step="0.1" min="0.5"
                    value={String(targets?.protein_g_per_kg ?? 1.6)}
                    onChange={(e) => setTargets((c) => ({
                      protein_g_per_kg: Number(e.target.value) || 1.6,
                      resistance_sessions_per_7d: c?.resistance_sessions_per_7d ?? 3,
                      targetProteinG: c?.targetProteinG ?? null,
                    }))} /></label>
                <label className="ha-field"><span>每周抗阻次数</span>
                  <input className="ha-input" type="number" step="1" min="1"
                    value={String(targets?.resistance_sessions_per_7d ?? 3)}
                    onChange={(e) => setTargets((c) => ({
                      protein_g_per_kg: c?.protein_g_per_kg ?? 1.6,
                      resistance_sessions_per_7d: Number(e.target.value) || 3,
                      targetProteinG: c?.targetProteinG ?? null,
                    }))} /></label>
                <div className="ha-row gap8">
                  <button className="ha-mini" onClick={() => void saveTargets(
                    targets?.protein_g_per_kg ?? 1.6,
                    targets?.resistance_sessions_per_7d ?? 3,
                    true,
                  )}>保存标准</button>
                  <span className="ha-muted">
                    {targets?.targetProteinG ? `当前目标 ${targets.targetProteinG} 克/天` : '先填档案体重才能算目标克数'}
                  </span>
                </div>
                {logRows.length > 0 ? (
                  <p className="ha-muted" style={{ margin: 0 }}>
                    最近一次标准变更：{String(logRows[logRows.length - 1].sentence ?? '')}
                  </p>
                ) : null}
              </div>

              <div className="ha-group">
                <div className="ha-group-title">记忆库</div>
                <p className="ha-muted" style={{ margin: 0 }}>一个路径就是一个人；切换即换人，不做跨库合并。</p>
                <label className="ha-field"><span>当前库</span>
                  <select className="ha-input" value={activeLibrary}
                    onChange={(e) => void switchLibrary(e.target.value)}>
                    <option value="">（默认：~/.dsh/health-assessment）</option>
                    {libraries.map((lib) => <option key={lib.path} value={lib.path}>{lib.codename} · {lib.path}</option>)}
                  </select></label>
                <label className="ha-field"><span>新增库路径</span>
                  <input className="ha-input" value={newLibrary} placeholder="/Users/you/health-memory-b"
                    onChange={(e) => setNewLibrary(e.target.value)} /></label>
                <div className="ha-row gap8">
                  <button className="ha-mini" onClick={() => void addLibrary()}>添加并切换</button>
                </div>
                <label className="ha-field"><span>从旧记忆库导入</span>
                  <input className="ha-input" value={importPath} placeholder="旧库目录，只读不写"
                    onChange={(e) => setImportPath(e.target.value)} /></label>
                <div className="ha-row gap8">
                  <button className="ha-mini" onClick={() => void runImport()}>导入旧库</button>
                </div>
              </div>

              <div className="ha-group">
                <div className="ha-group-title">诊断</div>
                <div className="ha-row gap8" style={{ flexWrap: 'wrap' }}>
                  <button className="ha-mini" onClick={() => void runDiagnostic('/followup/auto', '自动追问')}>立即自动检测</button>
                  <button className="ha-mini" onClick={() => void runDiagnostic('/followup/ask', '手动追问')}>立即追问</button>
                  <button className="ha-mini" onClick={() => void runDiagnostic('/pet/say', '宠物播报')}>测试桌宠</button>
                </div>
                {diag ? <p className="ha-muted" style={{ margin: 0 }}>{diag}</p> : null}
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

      {/* 选填录入 */}
      {optionalOpen ? (
        <OptionalDialog
          date={date}
          written={overview?.optional.written ?? {}}
          onSaved={() => { void load() }}
          onClose={() => setOptionalOpen(false)}
          busy={busy}
        />
      ) : null}

      {/* 单日详情 */}
      {detailOpen ? (
        <div className="ha-scrim" onClick={() => setDetailOpen(false)}>
          <div className="ha-modal ha-modal-sm" onClick={(event) => event.stopPropagation()}>
            <div className="ha-modal-head">
              <span>{detailDate} 的记录</span>
              <button className="ha-icon" title="关闭" onClick={() => setDetailOpen(false)}><Icon path={ICON.close} /></button>
            </div>
            <div className="ha-modal-body">
              {detail ? (
                <>
                  <p className="ha-muted" style={{ margin: 0 }}>
                    来源：{(detail.sources as string[] | undefined)?.join('、') || '未知'}
                  </p>
                  {(() => {
                    const body = (detail.body_required ?? {}) as Record<string, unknown>
                    const psych = (detail.psych_required ?? {}) as Record<string, unknown>
                    const optional = (detail.optional ?? {}) as Record<string, unknown>
                    const line = (label: string, value: unknown): JSX.Element => (
                      <div className="ha-kv"><span className="ha-muted">{label}</span><span>{value === null || value === undefined || value === '' ? '—' : String(value)}</span></div>
                    )
                    return (
                      <div className="ha-detail">
                        {line('蛋白质(g)', body.protein_g)}
                        {line('抗阻分钟', body.resistance_minutes)}
                        {line('完成抗阻', body.resistance_done === true ? '是' : body.resistance_done === false ? '否' : null)}
                        {line('超负荷', body.progressive_overload === true || body.overload === true ? '是' : null)}
                        {line('自评', psych.self_rating_1_to_5 ?? psych.execution_likert)}
                        {line('评价分类', psych.classification ?? psych.feedback_category)}
                        {line('红旗', ((detail.red_flags ?? []) as string[]).join('、'))}
                        <div className="ha-kv">
                          <span className="ha-muted">选填</span>
                          <span>{Object.keys(optional).length > 0 ? Object.entries(optional).map(([k, v]) => `${k}`).join('、') : '—'}</span>
                        </div>
                      </div>
                    )
                  })()}
                </>
              ) : <p className="ha-empty">这一天没有记录。</p>}
            </div>
            <div className="ha-modal-foot">
              <button className="ha-ghost" onClick={() => void deleteDay()} disabled={busy}>删除这一天</button>
              <button className="ha-primary" onClick={() => { setDetailOpen(false); setDate(detailDate) }}>切到这一天</button>
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

/** 模型选择：用宿主真实目录下拉，选不到时可手填。 */
function ModelPicker(props: {
  label: string
  catalog: { id: string; name: string; models: { id: string; name: string }[] }[]
  provider: string
  model: string
  emptyHint?: string
  onChange: (provider: string, model: string) => void
}) {
  const current = props.catalog.find((item) => item.id === props.provider)
  const hint = props.emptyHint ?? '留空 = 沿用 DSH 默认'
  return (
    <>
      <label className="ha-field"><span>{props.label} · provider</span>
        <select className="ha-input" value={props.provider}
          onChange={(event) => props.onChange(event.target.value, '')}>
          <option value="">{hint}</option>
          {props.catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label className="ha-field"><span>{props.label} · model</span>
        <select className="ha-input" value={props.model}
          onChange={(event) => props.onChange(props.provider, event.target.value)}>
          <option value="">{hint}</option>
          {(current?.models ?? []).map((model) => (
            <option key={model.id} value={model.id}>{model.name || model.id}</option>
          ))}
        </select>
      </label>
    </>
  )
}

/** 评分分项明细：5 项必填 + 选填得分，全部来自后端，不在前端重算。 */
function PartsBreakdown({ overview }: { overview: Overview | null }) {
  if (!overview) return null
  const score = overview.score
  const scores = score.scores
  const parts = scores?.body_required?.parts ?? {}
  const execution = scores?.psych_required?.execution ?? null
  const classification = scores?.psych_required?.classification ?? null
  const bodyOptional = scores as unknown as { body_optional?: { score?: number | null; items?: { item: string; points: number }[] } }
  const psychOptional = scores as unknown as { psych_optional?: { score?: number | null; items?: { item: string; points: number }[] } }

  const rows: { label: string; value: number }[] = []
  for (const key of ['蛋白质', '抗阻', '超负荷']) {
    const value = parts[key]
    if (typeof value === 'number') rows.push({ label: key, value })
  }
  if (typeof execution === 'number') rows.push({ label: '自评分', value: execution })
  if (typeof classification === 'number') rows.push({ label: '评价分类', value: classification })

  const optionalItems = [
    ...(bodyOptional.body_optional?.items ?? []),
    ...(psychOptional.psych_optional?.items ?? []),
  ]

  return (
    <div className="ha-parts">
      {rows.length === 0 ? <p className="ha-empty">还没有可评分的必填。</p> : null}
      {rows.map((row) => (
        <div className="ha-parts-row" key={row.label}>
          <span className="ha-parts-label">{row.label}</span>
          <span className="ha-bar"><i style={{ width: `${Math.min(100, row.value * 100)}%` }} /></span>
          <span className="ha-parts-num">{Math.round(row.value * 100)}%</span>
        </div>
      ))}
      <div className="ha-parts-sub">
        选填得分：身体 {bodyOptional.body_optional?.score ?? '无法评分'} / 心理 {psychOptional.psych_optional?.score ?? '无法评分'}
        {optionalItems.length > 0 ? ` · 已计 ${optionalItems.length} 项` : ' · 未写选填'}
      </div>
      {score.next_steps?.length ? (
        <ul className="ha-steps">{score.next_steps.map((step) => <li key={step}>{step}</li>)}</ul>
      ) : null}
    </div>
  )
}

/** 左侧导航图标。 */
export function HealthNavIcon() {
  return <Icon path={ICON.check} size={16} />
}
