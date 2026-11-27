/**
 * 面板开关的最小跨组件状态。
 *
 * 左栏入口按钮与全屏界面分处两个 slot，拿不到共同的 React 树，
 * 所以用一个模块级订阅器桥接：按钮 toggle，界面订阅。
 *
 * @module dsh-health-assessment/src/client/ui-state
 */
type Listener = (open: boolean) => void;
/** 打开 / 关闭 / 切换健康界面。 */
export declare const healthUi: {
    /** 当前是否打开。 */
    isOpen(): boolean;
    /** 直接设置开关状态。 */
    setOpen(next: boolean): void;
    /** 反转开关状态。 */
    toggle(): void;
    /** 订阅变化；返回退订函数。 */
    subscribe(listener: Listener): () => void;
};
export {};
