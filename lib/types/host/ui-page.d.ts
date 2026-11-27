/**
 * 插件界面：一页铺满的四个区块——输入、输出、评估、设置。
 *
 * 刻意不做侧边栏、不做大字号层级：整页是一张仪表盘，所有内容同屏，
 * 字号统一在 13px 一档，数字用等宽，靠间距与分隔线分区而不是靠大小对比。
 *
 * 页面由宿主直接渲染（`GET /health-assessment-8221/ui`），不依赖 DSH 的浏览器
 * 插件加载链，也不会另起一个应用窗口。
 *
 * @module dsh-health-assessment/src/host/ui-page
 */
/** 生成整页 HTML。 */
export declare function renderUiPage(): string;
