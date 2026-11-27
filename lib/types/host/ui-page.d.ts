/**
 * 宿主渲染的回退页面：与 React 主视图同一套信息架构。
 *
 * 结构一致：顶部单行 Header、65/35 主区、设置抽屉、CSV 收进「历史与导入」。
 * 只兜底「浏览器插件没挂上」的情况，不是主入口；因此不注入任何悬浮元素。
 *
 * @module dsh-health-assessment/src/host/ui-page
 */
/** 生成整页 HTML。 */
export declare function renderUiPage(): string;
