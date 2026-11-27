/**
 * 独立界面：由宿主直接渲染的一页式健康中心。
 *
 * 为什么不复用浏览器插件：DSH 的 client 插件要走 `__ModuleLoader__` + boot 图，
 * 一旦那条链没接上，用户就只剩插件页里的 README 可看。这里改成宿主路由直接吐
 * 一页自包含 HTML（内联样式与脚本、只调同源 API），打开 URL 就能用，不依赖任何
 * 前端加载协议。
 *
 * 页面里只有「展示与提交」，所有计算仍走 `/api` 背后的计分器。
 *
 * @module dsh-health-assessment/src/host/ui-page
 */
/** 生成独立界面 HTML。 */
export declare function renderUiPage(): string;
