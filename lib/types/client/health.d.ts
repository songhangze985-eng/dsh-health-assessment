/**
 * 健康评估主界面（React 组件）。
 *
 * 结构：顶部一行紧凑 Header（标题 + 共享日期 + 视图切换 + 状态 + 刷新 + 齿轮），
 * 下方主视图按 65/35 分成「打卡 + 待补」与「评估 + 趋势」；设置收进右侧抽屉。
 *
 * 约束（来自产品要求）：
 * - 不出现任何 snake_case 字段名或内部状态码，界面只说人话；
 * - 日期只有一个来源 `date`，标题、打卡、待补项共用；
 * - CSV 导入不常驻，收进「历史与导入」；
 * - 设置不常驻，点齿轮以抽屉打开。
 *
 * @module dsh-health-assessment/src/client/health
 */
/** 主界面。 */
export declare function HealthView(): import("react").JSX.Element;
/** 左栏导航图标：一颗心，尺寸随宿主传入。 */
export declare function HealthNavIcon(): import("react").JSX.Element;
