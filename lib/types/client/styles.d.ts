/**
 * 主界面样式：贴合 DSH 暗色，靠表面明暗分层，不用外框套内框。
 *
 * 约定：整页背景交给宿主，内容块用 `#1c1e22` / `#22252a` 两级表面区分；
 * 分隔线一律 `rgba(255,255,255,.06–.08)`；圆角 9–12px；内边距 16–18px。
 *
 * @module dsh-health-assessment/src/client/styles
 */
/** 注入样式（幂等）。 */
export declare function injectStyles(): void;
