/**
 * 主界面样式：贴合 DSH 暗色，靠表面明暗分层，不用外框套内框。
 *
 * 约定：整页背景交给宿主，内容块用 `#1c1e22` / `#22252a` 两级表面区分；
 * 分隔线一律 `rgba(255,255,255,.06–.08)`；圆角 9–12px；内边距 16–18px。
 *
 * @module dsh-health-assessment/src/client/styles
 */

const STYLE_ID = 'dsh-health-assessment-styles'

const CSS = `
.ha-root {
  display: flex; flex-direction: column; height: 100%; min-height: 0;
  background: transparent; color: inherit; font-size: 13px; line-height: 1.5;
}
.ha-header {
  display: flex; align-items: center; gap: 10px; padding: 10px 16px; flex: 0 0 auto;
  border-bottom: 1px solid rgba(255, 255, 255, .07);
}
.ha-title { font-weight: 600; font-size: 13px; }
.ha-date {
  background: #1f2125; border: 1px solid rgba(255, 255, 255, .08); border-radius: 8px;
  color: inherit; padding: 5px 8px; font: inherit; font-size: 12px; color-scheme: dark;
}
.ha-switch { display: flex; gap: 2px; background: #1c1e22; border-radius: 8px; padding: 2px; }
.ha-switch button {
  border: 0; background: transparent; color: #9aa0a8; padding: 5px 10px;
  border-radius: 6px; cursor: pointer; font: inherit; font-size: 12px;
}
.ha-switch button[data-active='true'] { background: #2a2d33; color: #e7e8ea; }
.ha-grow { flex: 1; }
.ha-dot { width: 7px; height: 7px; border-radius: 50%; background: #6b7078; flex: 0 0 auto; }
.ha-dot.ok { background: #4faa80; }
.ha-icon {
  width: 28px; height: 28px; border-radius: 7px; border: 1px solid rgba(255, 255, 255, .08);
  background: #1f2125; color: #c9ced6; cursor: pointer; font: inherit; font-size: 13px;
  display: inline-flex; align-items: center; justify-content: center;
}
.ha-icon:hover { background: #262a30; }
.ha-banner { padding: 8px 16px; font-size: 12px; }
.ha-banner.err { background: rgba(210, 102, 102, .12); color: #e08b8b; }
.ha-banner.ok { background: rgba(79, 170, 128, .12); color: #6cc79a; }
.ha-main {
  flex: 1; min-height: 0; display: grid; grid-template-columns: 65fr 35fr;
  gap: 16px; padding: 16px; overflow: auto;
}
.ha-col { display: flex; flex-direction: column; gap: 16px; min-height: 0; }
.ha-block {
  background: #1c1e22; border-radius: 12px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 10px;
}
.ha-block-head { display: flex; justify-content: space-between; align-items: center; color: #9aa0a8; font-size: 12px; }
.ha-muted { color: #7f858d; font-size: 12px; }
.ha-mono { font-variant-numeric: tabular-nums; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.ha-input {
  background: #22252a; border: 1px solid rgba(255, 255, 255, .06); border-radius: 9px;
  color: inherit; font: inherit; padding: 10px 12px; min-height: 96px; resize: vertical;
}
.ha-input:focus { outline: none; border-color: rgba(255, 255, 255, .18); }
.ha-actions { display: flex; align-items: center; gap: 10px; }
.ha-primary {
  background: #3757c9; border: 0; color: #fff; border-radius: 9px;
  padding: 9px 18px; font: inherit; cursor: pointer;
}
.ha-primary:hover { background: #3d5fdb; }
.ha-primary:disabled { opacity: .5; cursor: default; }
.ha-progress { height: 4px; background: rgba(255, 255, 255, .08); border-radius: 2px; overflow: hidden; }
.ha-progress i { display: block; height: 100%; background: #4faa80; border-radius: 2px; transition: width .25s; }
.ha-list { display: flex; flex-direction: column; gap: 2px; }
.ha-row {
  display: flex; align-items: center; gap: 10px; padding: 9px 8px; width: 100%;
  background: transparent; border: 0; border-radius: 8px; color: inherit;
  font: inherit; text-align: left; cursor: pointer;
}
.ha-row:hover { background: rgba(255, 255, 255, .04); }
.ha-row[data-done='true'] { cursor: default; }
.ha-row[data-done='true']:hover { background: transparent; }
.ha-row-icon { width: 16px; flex: 0 0 auto; color: #8b9099; }
.ha-row[data-done='true'] .ha-row-icon { color: #4faa80; }
.ha-row-label { min-width: 128px; flex: 0 0 auto; }
.ha-row-hint { flex: 1; color: #7f858d; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ha-pill {
  flex: 0 0 auto; font-size: 11px; padding: 2px 8px; border-radius: 999px;
  background: rgba(255, 255, 255, .06); color: #9aa0a8;
}
.ha-pill.ok { background: rgba(79, 170, 128, .16); color: #6cc79a; }
.ha-metrics { display: flex; gap: 10px; }
.ha-metric {
  flex: 1; background: #22252a; border-radius: 10px; padding: 12px 14px;
  display: flex; align-items: baseline; gap: 4px;
}
.ha-metric span { color: #9aa0a8; font-size: 12px; }
.ha-metric strong { font-size: 20px; font-variant-numeric: tabular-nums; font-weight: 600; }
.ha-metric em { color: #7f858d; font-style: normal; font-size: 11px; }
.ha-status { margin: 0; color: #9aa0a8; font-size: 12px; }
.ha-steps { margin: 0; padding-left: 16px; color: #c9ced6; font-size: 12px; display: flex; flex-direction: column; gap: 4px; }
.ha-heat { display: grid; grid-template-columns: repeat(14, 1fr); gap: 4px; margin-top: 4px; }
.ha-cell { aspect-ratio: 1; border-radius: 3px; background: #22252a; }
.ha-cell.lv1 { background: #2f4a3f; }
.ha-cell.lv2 { background: #33604c; }
.ha-cell.lv3 { background: #3d7d61; }
.ha-cell.lv4 { background: #4faa80; }
.ha-legend { display: flex; align-items: center; gap: 4px; color: #7f858d; font-size: 11px; margin-top: 6px; }
.ha-legend i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; background: #22252a; }
.ha-legend i.lv1 { background: #2f4a3f; }
.ha-legend i.lv2 { background: #33604c; }
.ha-legend i.lv3 { background: #3d7d61; }
.ha-legend i.lv4 { background: #4faa80; }
.ha-empty { margin: 0; color: #7f858d; font-size: 12px; }
.ha-history { display: flex; flex-direction: column; }
.ha-hrow {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 7px 0; border-bottom: 1px solid rgba(255, 255, 255, .05); font-size: 12px;
}
.ha-hrow:last-child { border-bottom: 0; }
.ha-tags { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
.ha-tag { font-size: 11px; padding: 1px 7px; border-radius: 999px; background: rgba(79, 170, 128, .14); color: #6cc79a; }
.ha-divider { height: 1px; background: rgba(255, 255, 255, .07); margin: 4px 0; }
.ha-field { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #9aa0a8; }
.ha-field .ha-input { min-height: 0; padding: 8px 10px; }
.ha-check { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #c9ced6; }
.ha-check input { width: auto; }
.ha-scrim {
  position: fixed; inset: 0; z-index: 60; background: rgba(0, 0, 0, .5);
  display: flex; justify-content: flex-end;
}
.ha-drawer {
  width: 380px; max-width: 92vw; height: 100%; background: #1b1d21;
  border-left: 1px solid rgba(255, 255, 255, .08);
  display: flex; flex-direction: column; box-shadow: -16px 0 40px rgba(0, 0, 0, .35);
}
.ha-drawer-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid rgba(255, 255, 255, .07); font-weight: 600;
}
.ha-drawer-body { flex: 1; overflow: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
.ha-drawer-foot { padding: 14px 18px; border-top: 1px solid rgba(255, 255, 255, .07); display: flex; justify-content: flex-end; }
@media (max-width: 980px) {
  .ha-main { grid-template-columns: 1fr; }
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
