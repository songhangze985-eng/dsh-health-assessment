/**
 * 面板样式：一段自包含 CSS，随插件注入一次。
 *
 * 不引 UI 组件库是刻意的——面板只需要表单、列表与一个进度环，
 * 自带样式能避免和宿主主题互相覆盖。
 *
 * @module dsh-health-assessment/src/client/styles
 */

/** 样式表 id，重复注入会被识别并跳过。 */
const STYLE_ID = 'dsh-health-assessment-styles'

const CSS = `
.ha-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 13px;
  color: var(--dsh-text, #e6e6e6);
  background: var(--dsh-bg, transparent);
}
.ha-head {
  display: flex;
  gap: 4px;
  padding: 8px 10px 6px;
  flex-wrap: wrap;
  border-bottom: 1px solid rgba(127, 127, 127, 0.18);
}
.ha-tab {
  border: 0;
  background: transparent;
  color: inherit;
  opacity: 0.6;
  padding: 4px 9px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
}
.ha-tab[data-active='true'] {
  opacity: 1;
  background: rgba(127, 127, 127, 0.18);
}
.ha-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ha-card {
  border: 1px solid rgba(127, 127, 127, 0.18);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ha-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.ha-row-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.ha-muted {
  opacity: 0.6;
  font-size: 12px;
}
.ha-big {
  font-size: 22px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.ha-ring {
  width: 84px;
  height: 84px;
  flex: 0 0 auto;
}
.ha-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  background: rgba(127, 127, 127, 0.16);
}
.ha-chip[data-tone='warn'] {
  background: rgba(220, 140, 40, 0.2);
}
.ha-chip[data-tone='bad'] {
  background: rgba(220, 70, 70, 0.2);
}
.ha-chip[data-tone='good'] {
  background: rgba(70, 180, 120, 0.2);
}
.ha-input,
.ha-textarea,
.ha-select {
  width: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid rgba(127, 127, 127, 0.28);
  background: rgba(127, 127, 127, 0.08);
  color: inherit;
  padding: 7px 9px;
  font: inherit;
}
.ha-textarea {
  min-height: 82px;
  resize: vertical;
}
.ha-button {
  border-radius: 8px;
  border: 1px solid rgba(127, 127, 127, 0.3);
  background: rgba(127, 127, 127, 0.16);
  color: inherit;
  padding: 6px 12px;
  cursor: pointer;
  font: inherit;
}
.ha-button:disabled {
  opacity: 0.5;
  cursor: default;
}
.ha-button[data-primary='true'] {
  background: rgba(90, 140, 240, 0.28);
  border-color: rgba(90, 140, 240, 0.5);
}
.ha-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ha-list-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(127, 127, 127, 0.08);
  font-variant-numeric: tabular-nums;
}
.ha-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ha-error {
  color: #e06c6c;
  font-size: 12px;
  white-space: pre-wrap;
}
.ha-ok {
  color: #5fbf8a;
  font-size: 12px;
  white-space: pre-wrap;
}
.ha-grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.ha-launcher {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  padding: 6px 8px;
  cursor: pointer;
  font: inherit;
  text-align: left;
  opacity: 0.75;
}
.ha-launcher:hover,
.ha-launcher[data-active='true'] {
  opacity: 1;
  background: rgba(127, 127, 127, 0.16);
}
.ha-launcher-glyph {
  font-size: 15px;
  line-height: 1;
  color: #e0574f;
}
.ha-launcher-label {
  font-size: 12px;
}
.ha-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}
.ha-overlay-card {
  width: min(980px, 92vw);
  height: min(760px, 88vh);
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  border: 1px solid rgba(127, 127, 127, 0.28);
  background: var(--dsh-bg, #1b1b1d);
  color: var(--dsh-text, #e6e6e6);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}
.ha-overlay-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(127, 127, 127, 0.18);
}
.ha-overlay-title {
  font-size: 14px;
  font-weight: 600;
}
.ha-overlay-body {
  flex: 1;
  min-height: 0;
  display: flex;
}
.ha-overlay-body > .ha-panel {
  flex: 1;
}
`

/** 注入样式（幂等）。 */
export function injectStyles(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}
