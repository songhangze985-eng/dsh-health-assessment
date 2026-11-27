/**
 * 右侧栏面板：六个视图都在这里。
 *
 * 设计取舍：
 * - 数据一律由 `/overview` 一次拿全，切换视图不重新请求，避免面板闪烁；
 * - 打分结果只展示后端给的值，不在前端重算（与 SKILL.md 的「不要心算」一致）；
 * - 写操作成功后统一刷新 overview，保证六个视图看到同一份事实。
 *
 * @module dsh-health-assessment/src/client/panel
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

import { api, type Overview, type SessionItem } from './api.js'
import { injectStyles } from './styles.js'

/** 视图标签。 */
type Tab = 'today' | 'checkin' | 'profile' | 'score' | 'history' | 'settings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: '今日' },
  { id: 'checkin', label: '打卡' },
  { id: 'profile', label: '档案' },
  { id: 'score', label: '评分' },
  { id: 'history', label: '历史' },
  { id: 'settings', label: '设置' },
]

/** 六项必填档案字段的展示信息。 */
const PROFILE_FIELDS = [
  { key: 'height_cm', label: '身高（cm）', type: 'number' },
  { key: 'weight_kg', label: '体重（kg）', type: 'number' },
  { key: 'age', label: '年龄', type: 'number' },
  { key: 'sex', label: '性别（female/male/other）', type: 'text' },
  { key: 'training_years', label: '训练年限', type: 'number' },
] as const

/** 百分比取整。 */
function percent(value: number | undefined): string {
  return `${Math.round((value ?? 0) * 100)}%`
}

/** 进度环。 */
function Ring({ ratio }: { ratio: number }) {
  const clamped = Math.max(0, Math.min(1, ratio))
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const dash = circumference * clamped
  return (
    <svg className="ha-ring" viewBox="0 0 84 84" role="img" aria-label={`完成度 ${percent(clamped)}`}>
      <circle cx="42" cy="42" r={radius} fill="none" stroke="rgba(127,127,127,0.22)" strokeWidth="8" />
      <circle
        cx="42"
        cy="42"
        r={radius}
        fill="none"
        stroke="rgba(90,140,240,0.85)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform="rotate(-90 42 42)"
      />
      <text x="42" y="46" textAnchor="middle" fontSize="15" fill="currentColor">
        {percent(clamped)}
      </text>
    </svg>
  )
}

/** 今日视图。 */
function TodayView({ overview, onRefresh }: { overview: Overview; onRefresh: () => void }) {
  const missing = overview.daily.missing_required_fields
  const flags = overview.redFlags
  return (
    <>
      <div className="ha-card">
        <div className="ha-row-between">
          <div>
            <div className="ha-big">{overview.date}</div>
            <div className="ha-muted">累计 {overview.distinctDates}/7 天</div>
          </div>
          <Ring ratio={overview.daily.required_completion_ratio} />
        </div>
        {flags.length > 0 ? (
          <div className="ha-row">
            <span className="ha-chip" data-tone="bad">红旗</span>
            <span>{flags.join('、')}：先联系医疗或当地紧急帮助，本轮不打分。</span>
          </div>
        ) : null}
      </div>

      <div className="ha-card">
        <div className="ha-row-between">
          <strong>今天还差</strong>
          <button className="ha-button" onClick={onRefresh}>刷新</button>
        </div>
        {missing.length === 0 ? (
          <div className="ha-muted">必填五项都齐了。可以补一条选填，或去看评分。</div>
        ) : (
          <div className="ha-list">
            {missing.map((item) => (
              <div className="ha-list-item" key={item}>
                <span>{item}</span>
                <span className="ha-chip" data-tone="warn">待补</span>
              </div>
            ))}
          </div>
        )}
        {overview.daily.recorded_optional_fields.length > 0 ? (
          <div className="ha-muted">已写选填：{overview.daily.recorded_optional_fields.join('、')}</div>
        ) : null}
      </div>

      <div className="ha-card">
        <div className="ha-row-between">
          <strong>当前评估</strong>
          <span className="ha-chip">{String(overview.score.mode ?? '')}</span>
        </div>
        {overview.score.mode === 'scored' ? (
          <div className="ha-row" style={{ gap: 16 }}>
            <div>
              <div className="ha-big">{String(overview.score.scores?.total?.score ?? '—')}</div>
              <div className="ha-muted">合计 /200</div>
            </div>
            <div>
              <div className="ha-big">{String(overview.score.scores?.body?.score ?? '—')}</div>
              <div className="ha-muted">身体 /100</div>
            </div>
            <div>
              <div className="ha-big">{String(overview.score.scores?.psych?.score ?? '—')}</div>
              <div className="ha-muted">心理 /100</div>
            </div>
          </div>
        ) : (
          <div className="ha-muted">
            {overview.score.mode === 'blocked_profile'
              ? `档案缺 ${(overview.profileMissing ?? []).join('、')}，补齐后才出分。`
              : overview.score.mode === 'redflag'
                ? '记录里有红旗，本轮停分。'
                : `未满 7 天（当前 ${overview.distinctDates} 天），先继续记。`}
          </div>
        )}
      </div>
    </>
  )
}

/** 打卡视图。 */
function CheckinView({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [csv, setCsv] = useState('')
  const [imageNote, setImageNote] = useState('')
  const [pendingImage, setPendingImage] = useState<{ base64: string; mediaType: string; name: string } | null>(null)

  const submitText = async (): Promise<void> => {
    if (!text.trim()) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await api.checkinText(text, date || undefined)
      setMessage(`已写入 ${result.session.date}（来源：${result.source === 'model' ? '规则+模型' : '本地规则'}）${result.warning ? `\n${result.warning}` : ''}`)
      setText('')
      onDone()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const submitCsv = async (): Promise<void> => {
    if (!csv.trim()) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await api.checkinTable({ csv, filename: 'paste.csv' })
      setMessage(`已导入 ${result.imported} 天${result.redFlags.length ? `；红旗：${result.redFlags.join('、')}` : ''}`)
      setCsv('')
      onDone()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const pickImage = (file: File): void => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const base64 = result.includes(',') ? result.slice(result.indexOf(',') + 1) : result
      setPendingImage({ base64, mediaType: file.type || 'image/jpeg', name: file.name })
    }
    reader.readAsDataURL(file)
  }

  const submitImage = async (): Promise<void> => {
    if (!pendingImage) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await api.checkinImage({
        base64: pendingImage.base64,
        mediaType: pendingImage.mediaType,
        name: pendingImage.name,
        date: date || undefined,
        note: imageNote || undefined,
      })
      setMessage(`图片已识别并写入 ${result.session.date}。`)
      setPendingImage(null)
      setImageNote('')
      onDone()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="ha-card">
        <strong>一句话打卡</strong>
        <textarea
          className="ha-textarea"
          placeholder="今天抗阻45分钟加了卧推重量，蛋白质140g，状态5分，不内耗"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="ha-row">
          <input className="ha-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <button className="ha-button" data-primary="true" disabled={busy} onClick={submitText}>
            记录
          </button>
        </div>
        <div className="ha-muted">留空日期表示今天。规则先解析，没写全时才会请模型补。</div>
      </div>

      <div className="ha-card">
        <strong>导入表格</strong>
        <textarea
          className="ha-textarea"
          style={{ minHeight: 64 }}
          placeholder="把 CSV 内容粘在这里（含表头）"
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
        />
        <div className="ha-row">
          <button className="ha-button" disabled={busy} onClick={submitCsv}>导入 CSV</button>
          <span className="ha-muted">列名支持：日期、蛋白质、抗阻、步数、静息心率、睡眠时长等</span>
        </div>
      </div>

      <div className="ha-card">
        <strong>导入图片</strong>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) pickImage(file)
          }}
        />
        <input
          className="ha-input"
          placeholder="补充一句说明（可选）"
          value={imageNote}
          onChange={(event) => setImageNote(event.target.value)}
        />
        {pendingImage ? (
          <div className="ha-row-between">
            <span className="ha-muted">图片会发给你在设置里指定的模型，确认后才会发送。</span>
            <button className="ha-button" data-primary="true" disabled={busy} onClick={submitImage}>
              确认发送
            </button>
          </div>
        ) : null}
      </div>

      {message ? <div className="ha-ok">{message}</div> : null}
      {error ? <div className="ha-error">{error}</div> : null}
    </>
  )
}

/** 档案视图。 */
function ProfileView({ overview, onSaved }: { overview: Overview; onSaved: () => void }) {
  const [draft, setDraft] = useState<Record<string, unknown>>(overview.profile ?? {})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setDraft(overview.profile ?? {})
  }, [overview.profile])

  const save = async (): Promise<void> => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.saveProfile(draft)
      setMessage('档案已保存。')
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ha-card">
      <strong>基础档案</strong>
      {overview.profileMissing.length > 0 ? (
        <div className="ha-error">还缺：{overview.profileMissing.join('、')}</div>
      ) : (
        <div className="ha-muted">六项必填已齐，可以出分。</div>
      )}
      <div className="ha-grid2">
        {PROFILE_FIELDS.map((field) => (
          <label className="ha-field" key={field.key}>
            <span className="ha-muted">{field.label}</span>
            <input
              className="ha-input"
              type={field.type}
              value={String(draft[field.key] ?? '')}
              onChange={(event) => {
                const value = event.target.value
                setDraft((current) => ({
                  ...current,
                  [field.key]: field.type === 'number' ? (value === '' ? null : Number(value)) : value,
                }))
              }}
            />
          </label>
        ))}
      </div>
      <label className="ha-row">
        <input
          type="checkbox"
          checked={draft.injury === true}
          onChange={(event) => setDraft((current) => ({ ...current, injury: event.target.checked }))}
        />
        <span>有伤病（只作备注，不因此停分）</span>
      </label>
      <div className="ha-row-between">
        <span className="ha-muted">缺字段不能估算。</span>
        <button className="ha-button" data-primary="true" disabled={busy} onClick={save}>保存</button>
      </div>
      {message ? <div className="ha-ok">{message}</div> : null}
      {error ? <div className="ha-error">{error}</div> : null}
    </div>
  )
}

/** 评分视图。 */
function ScoreView({ overview }: { overview: Overview }) {
  const score = overview.score
  const scores = score.scores as Record<string, any> | undefined
  const conclusion = score.conclusion as Record<string, string> | undefined
  const steps = (score.next_steps as string[] | undefined) ?? []

  if (score.mode !== 'scored') {
    return (
      <div className="ha-card">
        <strong>评分</strong>
        <div className="ha-muted">
          {score.mode === 'blocked_profile'
            ? '档案缺字段，先补档案。'
            : score.mode === 'redflag'
              ? '有红旗信号，本轮不打分。'
              : `${String(score.label ?? '未满 7 天')}，先继续记。`}
        </div>
      </div>
    )
  }

  const parts = (scores?.body_required?.parts ?? {}) as Record<string, number>
  const optionalBody = (scores?.body_optional?.items ?? []) as { item: string; points: number }[]
  const optionalPsych = (scores?.psych_optional?.items ?? []) as { item: string; points: number }[]

  return (
    <>
      <div className="ha-card">
        <div className="ha-row" style={{ gap: 18 }}>
          <div>
            <div className="ha-big">{String(scores?.total?.score ?? '—')}</div>
            <div className="ha-muted">合计 /200</div>
          </div>
          <div>
            <div className="ha-big">{String(scores?.body?.score ?? '—')}</div>
            <div className="ha-muted">身体 /100</div>
          </div>
          <div>
            <div className="ha-big">{String(scores?.psych?.score ?? '—')}</div>
            <div className="ha-muted">心理 /100</div>
          </div>
        </div>
        <div className="ha-muted">窗口 {String(score.distinct_dates)} 天 / 跨度 {String(score.calendar_span_days)} 天</div>
      </div>

      <div className="ha-card">
        <strong>必填明细</strong>
        <div className="ha-list">
          {Object.entries(parts).map(([key, value]) => (
            <div className="ha-list-item" key={key}>
              <span>{key}</span>
              <span>{percent(value)}</span>
            </div>
          ))}
        </div>
        <div className="ha-muted">
          自评分 {percent(scores?.psych_required?.execution)} · 评价分类 {percent(scores?.psych_required?.classification)}
        </div>
      </div>

      <div className="ha-card">
        <strong>选填</strong>
        {optionalBody.length === 0 && optionalPsych.length === 0 ? (
          <div className="ha-muted">没写选填，这部分记「无法评分」，不记 0。</div>
        ) : (
          <div className="ha-list">
            {[...optionalBody, ...optionalPsych].map((item) => (
              <div className="ha-list-item" key={`${item.item}`}>
                <span>{item.item}</span>
                <span>{item.points}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ha-card">
        <strong>结论</strong>
        <div>{conclusion?.['薄肌']}</div>
        <div>{conclusion?.['黄毛']}</div>
        {steps.length > 0 ? (
          <div className="ha-list">
            {steps.map((step) => (
              <div className="ha-list-item" key={step}><span>{step}</span></div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  )
}

/** 历史视图。 */
function HistoryView({ sessions }: { sessions: SessionItem[] }) {
  if (sessions.length === 0) {
    return <div className="ha-card ha-muted">还没有记录。</div>
  }
  return (
    <div className="ha-card">
      <strong>最近 {sessions.length} 天</strong>
      <div className="ha-list">
        {sessions.map((session) => {
          const body = session.body_required ?? {}
          const psych = session.psych_required ?? {}
          const chips: { label: string; tone: string }[] = []
          if (body.protein_g !== undefined && body.protein_g !== null) chips.push({ label: `蛋白 ${String(body.protein_g)}g`, tone: 'good' })
          if (body.resistance_done === true || body.resistance_minutes) chips.push({ label: '抗阻', tone: 'good' })
          if (body.progressive_overload === true) chips.push({ label: '超负荷', tone: 'good' })
          if (psych.self_rating_1_to_5 !== undefined && psych.self_rating_1_to_5 !== null) chips.push({ label: `自评 ${String(psych.self_rating_1_to_5)}`, tone: 'good' })
          if (psych.classification) chips.push({ label: String(psych.classification), tone: 'good' })
          return (
            <div className="ha-list-item" key={session.date} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <div className="ha-row" style={{ gap: 6, flexWrap: 'wrap' }}>
                <strong>{session.date}</strong>
                {(session.sources ?? []).map((source) => (
                  <span className="ha-chip" key={source}>{source === 'self_report' ? '自述' : source}</span>
                ))}
              </div>
              <div className="ha-row" style={{ gap: 4, flexWrap: 'wrap' }}>
                {chips.length === 0 ? <span className="ha-muted">无必填</span> : chips.map((chip) => (
                  <span className="ha-chip" data-tone={chip.tone} key={chip.label}>{chip.label}</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** 设置视图。 */
function SettingsView({ settings, onSaved }: { settings: Record<string, any>; onSaved: () => void }) {
  const [draft, setDraft] = useState<Record<string, any>>(settings ?? {})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [importPath, setImportPath] = useState('')

  useEffect(() => {
    setDraft(settings ?? {})
  }, [settings])

  const save = async (): Promise<void> => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.saveSettings(draft)
      setMessage('设置已保存。')
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const runImport = async (): Promise<void> => {
    if (!importPath.trim()) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await api.importLibrary(importPath.trim())
      setMessage(`导入 ${result.imported} 个文件，跳过 ${result.skipped} 个。`)
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const field = (key: string, label: string, kind: 'text' | 'number' | 'checkbox' | 'time' = 'text') => (
    <label className="ha-field" key={key}>
      <span className="ha-muted">{label}</span>
      {kind === 'checkbox' ? (
        <input
          type="checkbox"
          checked={draft[key] === true}
          onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.checked }))}
        />
      ) : (
        <input
          className="ha-input"
          type={kind}
          value={String(draft[key] ?? '')}
          onChange={(event) => setDraft((current) => ({
            ...current,
            [key]: kind === 'number' ? Number(event.target.value) : event.target.value,
          }))}
        />
      )}
    </label>
  )

  return (
    <>
      <div className="ha-card">
        <strong>抽取模型</strong>
        <div className="ha-muted">留空表示沿用 DSH 当前默认模型。图片识别需要具备视觉能力的模型。</div>
        {field('extractionProvider', 'provider')}
        {field('extractionModel', 'model')}
      </div>

      <div className="ha-card">
        <strong>每日追问</strong>
        {field('dailyAskEnabled', '每天首次打开时自动开新会话追问', 'checkbox')}
        {field('dailyAskTime', '定时追问时刻（HH:MM，留空表示只在打开时）', 'time')}
        {field('dailyAskWorkspace', '追问会话的工作区路径（留空用当前）')}
        {field('escalateHours', '未回复多久后升级再问（小时）', 'number')}
      </div>

      <div className="ha-card">
        <strong>桌宠与隐私</strong>
        {field('petEnabled', '出分时让桌宠播报一次', 'checkbox')}
        {field('confirmImageUpload', '图片发送前需要确认', 'checkbox')}
      </div>

      <div className="ha-card">
        <strong>从旧记忆库导入</strong>
        <div className="ha-muted">只读旧库、写入当前库；不会改动旧文件。</div>
        <input
          className="ha-input"
          placeholder="/path/to/old-memory-store"
          value={importPath}
          onChange={(event) => setImportPath(event.target.value)}
        />
        <button className="ha-button" disabled={busy} onClick={runImport}>导入</button>
      </div>

      <div className="ha-row-between">
        <span className="ha-muted">设置写在当前记忆库里。</span>
        <button className="ha-button" data-primary="true" disabled={busy} onClick={save}>保存设置</button>
      </div>
      {message ? <div className="ha-ok">{message}</div> : null}
      {error ? <div className="ha-error">{error}</div> : null}
    </>
  )
}

/**
 * 面板根组件。
 *
 * 首屏拉一次 overview，之后所有写操作完成都回到这里刷新。
 */
export function HealthPanel() {
  const [tab, setTab] = useState<Tab>('today')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const [next, history] = await Promise.all([api.overview(), api.sessions()])
      setOverview(next)
      setSessions(history)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    injectStyles()
    void refresh()
  }, [refresh])

  // 打卡即算回复：面板上有动作就刷新追问状态，避免升级追问误判。
  const markReply = useCallback((): void => {
    void api.markReply().catch(() => undefined)
  }, [])

  const body = useMemo(() => {
    if (!overview) return null
    if (tab === 'today') return <TodayView overview={overview} onRefresh={() => void refresh()} />
    if (tab === 'checkin') return <CheckinView onDone={() => { markReply(); void refresh() }} />
    if (tab === 'profile') return <ProfileView overview={overview} onSaved={() => void refresh()} />
    if (tab === 'score') return <ScoreView overview={overview} />
    if (tab === 'history') return <HistoryView sessions={sessions} />
    return <SettingsView settings={overview.settings} onSaved={() => void refresh()} />
  }, [tab, overview, sessions, refresh, markReply])

  return (
    <div className="ha-panel">
      <div className="ha-head">
        {TABS.map((item) => (
          <button
            key={item.id}
            className="ha-tab"
            data-active={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="ha-body">
        {loading && !overview ? <div className="ha-muted">读取中…</div> : null}
        {error ? <div className="ha-error">{error}</div> : null}
        {body}
      </div>
    </div>
  )
}
