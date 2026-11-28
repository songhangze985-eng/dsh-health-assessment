/**
 * 选填录入弹窗：58 项按 15 个维度手风琴分组。
 *
 * 与设置 Modal 同一套外观（`.ha-modal`），不新开视图。
 * 每项一行「标签 + 1…5 五档 + 清除」；睡眠时长额外给小时输入。
 *
 * @module dsh-health-assessment/src/client/optional
 */
/** 组件属性。 */
interface Props {
    /** 当前日期。 */
    date: string;
    /** 已写值（键 → 1–5 或 { hours }）。 */
    written: Record<string, unknown>;
    /** 保存后回调。 */
    onSaved: () => void;
    /** 关闭。 */
    onClose: () => void;
    /** 是否忙碌。 */
    busy?: boolean;
}
/** 选填录入弹窗。 */
export declare function OptionalDialog(props: Props): import("react").JSX.Element;
export {};
