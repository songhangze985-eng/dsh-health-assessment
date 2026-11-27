/**
 * 右侧栏面板：六个视图都在这里。
 *
 * 设计取舍：
 * - 数据一律由 `/overview` 一次拿全，切换视图不重新请求，避免面板闪烁；
 * - 打分结果只展示后端给的值，不在前端重算（与 SKILL.md 的「不要心算」一致）；
 * - 写操作成功后统一刷新 overview，保证六个视图看到同一份事实。
 *
 * @module dsh-health-assessment/src/client/panel
 */
/**
 * 面板根组件。
 *
 * 首屏拉一次 overview，之后所有写操作完成都回到这里刷新。
 */
export declare function HealthPanel(): import("react").JSX.Element;
