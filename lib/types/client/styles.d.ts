/**
 * 面板样式：一段自包含 CSS，随插件注入一次。
 *
 * 不引 UI 组件库是刻意的——面板只需要表单、列表与一个进度环，
 * 自带样式能避免和宿主主题互相覆盖。
 *
 * @module dsh-health-assessment/src/client/styles
 */
/** 注入样式（幂等）。 */
export declare function injectStyles(): void;
