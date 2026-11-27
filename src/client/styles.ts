/**
 * 主界面样式：全高铺满、SVG 图标按钮、居中 Modal、无边框嵌套。
 *
 * @module dsh-health-assessment/src/client/styles
 */

const STYLE_ID = 'dsh-health-assessment-styles'

const CSS = `
.ha-root {
  display: flex; flex-direction: column; height: 100%; min-height: 100%;
  background: transparent; color: inherit; font-size: 13px; line-height: 1.5;
}
.ha-header {
  display: flex; align-items: center; gap: 10px; padding: 10px 16px; flex: 0 0 auto;
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.ha-title { font-weight: 600; }
.ha-date {
  background: #1f2125; border: 1px solid rgba(255,255,255,.08); border-radius: 8px;
  color: inherit; padding: 5px 8px; font: inherit; font-size: 12px; color-scheme: dark;
}
.ha-grow { flex: 1; }
.ha-dot { width: 7px; height: 7px; border-radius: 50%; background: #6b7078; flex: 0 0 auto; }
.ha-dot.ok { background: #4faa80; }
.ha-icon {
  width: 32px; height: 32px; flex: 0 0 auto; border-radius: 8px;
  border: 1px solid rgba(255,255,255,.08); background: #1f2125; color: #c9ced6;
  cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  padding: 0; transition: background .15s, color .15s;
}
.ha-icon:hover { background: #262a30; color: #fff; }
.ha-spin { display: inline-flex; animation: ha-rotate .9s linear infinite; }
@keyframes ha-rotate { to { transform: rotate(360deg); } }
.ha-banner { padding: 8px 16px; font-size: 12px; }
.ha-banner.err { background: rgba(210,102,102,.12); color: #e08b8b; }
.ha-banner.ok { background: rgba(79,170,128,.12); color: #6cc79a; }

/* 全高双栏：两栏都拉伸到底 */
.ha-main {
  flex: 1 1 auto; min-height: 0; display: grid;
  grid-template-columns: minmax(0, 65fr) minmax(0, 35fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 16px; padding: 16px;
}
.ha-col { display: flex; flex-direction: column; gap: 16px; min-height: 0; min-width: 0; }
.ha-block {
  background: #1c1e22; border-radius: 12px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 12px; min-height: 0;
}
.ha-block-grow { flex: 1 1 auto; overflow: auto; }
.ha-block-head { display: flex; justify-content: space-between; align-items: center; color: #9aa0a8; font-size: 12px; flex: 0 0 auto; }
.ha-muted { color: #7f858d; font-size: 12px; }

/* 输入区 */
.ha-composer {
  display: flex; flex-direction: column; gap: 10px; flex: 1 1 auto; min-height: 0;
  border: 1px dashed transparent; border-radius: 10px; transition: border-color .15s, background .15s;
}
.ha-composer.dragging { border-color: #3757c9; background: rgba(55,87,201,.06); }
.ha-textarea {
  flex: 1 1 auto; min-height: 110px; resize: none; width: 100%;
  background: #22252a; border: 1px solid rgba(255,255,255,.06); border-radius: 9px;
  color: inherit; font: inherit; padding: 10px 12px;
}
.ha-textarea:focus { outline: none; border-color: rgba(255,255,255,.18); }
.ha-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ha-chip {
  display: inline-flex; align-items: center; gap: 6px; max-width: 260px;
  background: #22252a; border-radius: 8px; padding: 4px 6px 4px 8px; font-size: 12px;
}
.ha-thumb { width: 22px; height: 22px; border-radius: 4px; object-fit: cover; }
.ha-chip-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #c9ced6; }
.ha-chip-state { font-size: 11px; color: #7f858d; flex: 0 0 auto; }
.ha-chip-state.done { color: #6cc79a; }
.ha-chip-state.error { color: #e08b8b; }
.ha-chip-x {
  width: 20px; height: 20px; border: 0; background: transparent; color: #7f858d;
  cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0; border-radius: 4px;
}
.ha-chip-x:hover { background: rgba(255,255,255,.08); color: #fff; }
.ha-composer-bar { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
.ha-primary {
  background: #3757c9; border: 0; color: #fff; border-radius: 9px;
  padding: 8px 16px; font: inherit; cursor: pointer; display: inline-flex;
  align-items: center; gap: 6px; justify-content: center;
}
.ha-primary:hover { background: #3d5fdb; }
.ha-primary:disabled { opacity: .5; cursor: default; }
.ha-ghost {
  background: transparent; border: 1px solid rgba(255,255,255,.12); color: #c9ced6;
  border-radius: 9px; padding: 8px 16px; font: inherit; cursor: pointer;
}
.ha-ghost:hover { background: rgba(255,255,255,.06); }

/* 清单 */
.ha-progress { height: 4px; background: rgba(255,255,255,.08); border-radius: 2px; overflow: hidden; flex: 0 0 auto; }
.ha-progress i { display: block; height: 100%; background: #4faa80; border-radius: 2px; transition: width .25s; }
.ha-list { display: flex; flex-direction: column; gap: 2px; }
.ha-row {
  display: flex; align-items: center; gap: 10px; padding: 9px 8px; width: 100%;
  background: transparent; border: 0; border-radius: 8px; color: inherit;
  font: inherit; text-align: left; cursor: pointer;
}
.ha-row:hover { background: rgba(255,255,255,.04); }
.ha-row[data-done='true'] { cursor: default; }
.ha-row[data-done='true']:hover { background: transparent; }
.ha-row-icon { width: 18px; flex: 0 0 auto; display: inline-flex; color: #8b9099; }
.ha-row[data-done='true'] .ha-row-icon { color: #4faa80; }
.ha-row-label { min-width: 132px; flex: 0 0 auto; white-space: nowrap; }
.ha-row-hint { flex: 1; color: #7f858d; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ha-row[data-done='true'] .ha-row-hint { color: #6cc79a; }
.ha-pill {
  flex: 0 0 auto; font-size: 11px; padding: 2px 8px; border-radius: 999px;
  background: rgba(255,255,255,.06); color: #9aa0a8; white-space: nowrap;
}
.ha-pill.ok { background: rgba(79,170,128,.16); color: #6cc79a; }

/* 仪表盘：环形 + 双进度条 */
.ha-score { display: flex; align-items: center; gap: 18px; }
.ha-ring { flex: 0 0 auto; }
.ha-ring-num { fill: #e7e8ea; font-size: 24px; font-weight: 600; font-variant-numeric: tabular-nums; }
.ha-ring-sub { fill: #7f858d; font-size: 10px; }
.ha-bars { flex: 1 1 auto; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.ha-bar-row { display: flex; align-items: center; gap: 8px; }
.ha-bar-label { flex: 0 0 auto; width: 32px; color: #9aa0a8; font-size: 12px; white-space: nowrap; }
.ha-bar { flex: 1 1 auto; height: 6px; background: rgba(255,255,255,.08); border-radius: 3px; overflow: hidden; min-width: 0; }
.ha-bar i { display: block; height: 100%; background: #3757c9; border-radius: 3px; transition: width .25s; }
.ha-bar-num { flex: 0 0 auto; font-variant-numeric: tabular-nums; font-size: 12px; white-space: nowrap; min-width: 52px; text-align: right; }
.ha-bar-num em { font-style: normal; color: #7f858d; font-size: 11px; }
.ha-status { margin: 0; color: #9aa0a8; font-size: 12px; }
.ha-profile-cta { align-self: flex-start; }
.ha-steps { margin: 0; padding-left: 16px; color: #c9ced6; font-size: 12px; display: flex; flex-direction: column; gap: 4px; }

/* 热力图 */
.ha-heat { display: grid; grid-template-columns: repeat(14, 1fr); gap: 4px; }
.ha-cell { aspect-ratio: 1; border-radius: 3px; background: #22252a; border: 0; cursor: pointer; padding: 0; }
.ha-cell:hover { outline: 1px solid rgba(255,255,255,.3); outline-offset: 1px; }
.ha-cell.lv1 { background: #2f4a3f; }
.ha-cell.lv2 { background: #33604c; }
.ha-cell.lv3 { background: #3d7d61; }
.ha-cell.lv4 { background: #4faa80; }
.ha-ticks { display: flex; justify-content: space-between; color: #7f858d; font-size: 10px; margin-top: 2px; }
.ha-legend { display: flex; align-items: center; gap: 4px; color: #7f858d; font-size: 11px; }
.ha-legend i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; background: #22252a; }
.ha-legend i.lv1 { background: #2f4a3f; }
.ha-legend i.lv2 { background: #33604c; }
.ha-legend i.lv3 { background: #3d7d61; }
.ha-legend i.lv4 { background: #4faa80; }
.ha-empty { margin: 0; color: #7f858d; font-size: 12px; }

/* 居中 Modal */
.ha-scrim {
  position: fixed; inset: 0; z-index: 80; background: rgba(0,0,0,.45);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.ha-modal {
  width: min(560px, 92vw); max-height: 82vh; display: flex; flex-direction: column;
  background: #1b1d21; border-radius: 14px; border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 24px 64px rgba(0,0,0,.5); overflow: hidden;
}
.ha-modal-sm { width: min(460px, 92vw); }
.ha-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,.07); font-weight: 600;
}
.ha-modal-body { flex: 1 1 auto; overflow: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 16px; }
.ha-modal-foot {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 18px; border-top: 1px solid rgba(255,255,255,.07);
}
.ha-group { display: flex; flex-direction: column; gap: 10px; }
.ha-group-title { color: #9aa0a8; font-size: 12px; padding-bottom: 2px; border-bottom: 1px solid rgba(255,255,255,.05); }
.ha-field { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: #9aa0a8; }
.ha-input {
  background: #22252a; border: 1px solid rgba(255,255,255,.06); border-radius: 8px;
  color: inherit; font: inherit; padding: 8px 10px; width: 100%;
}
.ha-input:focus { outline: none; border-color: rgba(255,255,255,.18); }
.ha-check { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #c9ced6; }
.ha-check input, .ha-field input[type=checkbox] { width: auto; }
.ha-pre {
  margin: 0; background: #22252a; border-radius: 8px; padding: 12px;
  font-size: 11px; line-height: 1.5; max-height: 260px; overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #c9ced6;
}

@media (max-width: 980px) {
  .ha-main { grid-template-columns: 1fr; grid-template-rows: auto auto; }
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
