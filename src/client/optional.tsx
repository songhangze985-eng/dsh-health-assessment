/**
 * 选填录入弹窗：58 项按 15 个维度手风琴分组。
 *
 * 与设置 Modal 同一套外观（`.ha-modal`），不新开视图。
 * 每项一行「标签 + 1…5 五档 + 清除」；睡眠时长额外给小时输入。
 *
 * @module dsh-health-assessment/src/client/optional
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

const PREFIX = '/health-assessment-8221'

/** 目录项。 */
interface CatalogItem { key: string; side: 'body' | 'psych'; hours?: boolean }
/** 分组。 */
interface CatalogGroup { id: string; title: string; side: 'body' | 'psych'; items: CatalogItem[] }

/** 组件属性。 */
interface Props {
  /** 当前日期。 */
  date: string
  /** 已写值（键 → 1–5 或 { hours }）。 */
  written: Record<string, unknown>
  /** 保存后回调。 */
  onSaved: () => void
  /** 关闭。 */
  onClose: () => void
  /** 是否忙碌。 */
  busy?: boolean
}

/** 读一个已写值为 1–5 档位；非整数返回 0。 */
function levelOf(value: unknown): number {
  if (typeof value === 'number' && value >= 1 && value <= 5) return Math.round(value)
  return 0
}

/** 读小时数。 */
function hoursOf(value: unknown): string {
  if (value && typeof value === 'object' && 'hours' in value) {
    const hours = Number((value as { hours?: number }).hours)
    return Number.isFinite(hours) ? String(hours) : ''
  }
  return ''
}

/** 选填录入弹窗。 */
export function OptionalDialog(props: Props) {
  const [groups, setGroups] = useState<CatalogGroup[]>([])
  const [hints, setHints] = useState<Record<string, string>>({})
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const [open, setOpen] = useState<string>('sleep')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // 打开时拉目录，并把已写值灌进草稿。
  useEffect(() => {
    setDraft({ ...props.written })
    let alive = true
    void (async () => {
      try {
        const response = await fetch(`${PREFIX}/optional/catalog`, { credentials: 'same-origin' })
        const payload = (await response.json()) as { groups?: CatalogGroup[]; hints?: Record<string, string> }
        if (!alive) return
        setGroups(payload.groups ?? [])
        setHints(payload.hints ?? {})
      } catch (cause) {
        if (alive) setError(cause instanceof Error ? cause.message : String(cause))
      }
    })()
    return () => { alive = false }
  }, [props.date])

  const writtenCount = useMemo(
    () => Object.values(draft).filter((value) => value !== null && value !== undefined).length,
    [draft],
  )

  const setLevel = useCallback((key: string, level: number): void => {
    setDraft((current) => {
      const next = { ...current }
      if (next[key] === level) delete next[key]
      else next[key] = level
      return next
    })
  }, [])

  const clear = useCallback((key: string): void => {
    setDraft((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }, [])

  const save = async (): Promise<void> => {
    setSaving(true)
    setError('')
    try {
      const items: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(draft)) {
        if (value === null || value === undefined || value === '') continue
        items[key] = value
      }
      const response = await fetch(`${PREFIX}/checkin/optional`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: props.date, items }),
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(payload.error || `保存失败：${response.status}`)
      props.onSaved()
      props.onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ha-scrim" onClick={props.onClose}>
      <div className="ha-modal ha-modal-wide" onClick={(event) => event.stopPropagation()}>
        <div className="ha-modal-head">
          <span>选填 · {props.date}</span>
          <button className="ha-icon" title="关闭" onClick={props.onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.75" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="ha-modal-body">
          <p className="ha-muted" style={{ margin: 0 }}>
            只写今天实际发生的小项；没写的不记 0 分，记「无法评分」。已写 {writtenCount} 项。
          </p>
          {error ? <p className="ha-error-text">{error}</p> : null}
          {groups.map((group) => {
            const expanded = open === group.id
            const groupWritten = group.items.filter((item) => draft[item.key] !== undefined && draft[item.key] !== null).length
            return (
              <div className="ha-acc" key={group.id}>
                <button className="ha-acc-head" onClick={() => setOpen(expanded ? '' : group.id)}>
                  <span className={`ha-acc-caret${expanded ? ' open' : ''}`}>▸</span>
                  <span>{group.title}</span>
                  <span className="ha-muted">
                    {group.side === 'body' ? '身体' : '心理'} · {groupWritten}/{group.items.length}
                  </span>
                </button>
                {expanded ? (
                  <div className="ha-acc-body">
                    {group.items.map((item) => (
                      <div className="ha-opt-row" key={item.key}>
                        <span className="ha-opt-label" title={hints[item.key] ?? ''}>{item.key}</span>
                        {item.hours ? (
                          <span className="ha-opt-hours">
                            <input
                              className="ha-input ha-input-inline"
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              placeholder="小时"
                              value={hoursOf(draft[item.key])}
                              onChange={(event) => {
                                const value = event.target.value
                                setDraft((current) => {
                                  const next = { ...current }
                                  if (value === '') delete next[item.key]
                                  else next[item.key] = { hours: Number(value) }
                                  return next
                                })
                              }}
                            />
                            <span className="ha-muted">小时</span>
                          </span>
                        ) : (
                          <span className="ha-levels">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <button
                                key={level}
                                className="ha-level"
                                data-active={levelOf(draft[item.key]) === level}
                                title={hints[item.key] ?? `${level} 分`}
                                onClick={() => setLevel(item.key, level)}
                              >
                                {level}
                              </button>
                            ))}
                          </span>
                        )}
                        <button
                          className="ha-chip-x"
                          title="清除这一项"
                          onClick={() => clear(item.key)}
                          disabled={draft[item.key] === undefined || draft[item.key] === null}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
        <div className="ha-modal-foot">
          <span className="ha-muted" style={{ marginRight: 'auto' }}>
            选填只在写过的小项之间平分 20 分（每侧）
          </span>
          <button className="ha-ghost" onClick={props.onClose}>取消</button>
          <button className="ha-primary" disabled={saving || props.busy} onClick={() => void save()}>
            {saving ? '保存中…' : '保存选填'}
          </button>
        </div>
      </div>
    </div>
  )
}
