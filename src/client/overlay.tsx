/**
 * 左栏入口与独立界面。
 *
 * `HealthLauncher` 挂在左侧栏底部动作区（`sidebar.footer.action`）；
 * `HealthOverlay` 挂在全屏层（`shell.overlay`），点开后是一块独立的健康中心，
 * 不挤占对话区，Esc 或右上角关闭。
 *
 * @module dsh-health-assessment/src/client/overlay
 */

import { useEffect, useState } from 'react'

import { HealthPanel } from './panel.js'
import { healthUi } from './ui-state.js'

/** 左侧栏入口按钮。 */
export function HealthLauncher(props: { wide?: boolean } = {}) {
  const [open, setOpen] = useState(healthUi.isOpen())
  useEffect(() => healthUi.subscribe(setOpen), [])
  void props
  return (
    <button
      type="button"
      className="ha-launcher"
      data-active={open}
      title="打开健康评估"
      onClick={() => healthUi.toggle()}
    >
      <span className="ha-launcher-glyph" aria-hidden="true">♥</span>
      <span className="ha-launcher-label">健康评估</span>
    </button>
  )
}

/** 独立健康界面（全屏层）。 */
export function HealthOverlay() {
  const [open, setOpen] = useState(healthUi.isOpen())
  useEffect(() => healthUi.subscribe(setOpen), [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') healthUi.setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  return (
    <div className="ha-overlay" role="dialog" aria-label="健康评估">
      <div className="ha-overlay-card">
        <div className="ha-overlay-head">
          <span className="ha-overlay-title">健康评估</span>
          <button type="button" className="ha-button" onClick={() => healthUi.setOpen(false)}>关闭</button>
        </div>
        <div className="ha-overlay-body">
          <HealthPanel />
        </div>
      </div>
    </div>
  )
}
