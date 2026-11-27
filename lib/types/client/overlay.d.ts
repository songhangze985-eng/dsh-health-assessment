/**
 * 左栏入口与独立界面。
 *
 * `HealthLauncher` 挂在左侧栏底部动作区（`sidebar.footer.action`）；
 * `HealthOverlay` 挂在全屏层（`shell.overlay`），点开后是一块独立的健康中心，
 * 不挤占对话区，Esc 或右上角关闭。
 *
 * @module dsh-health-assessment/src/client/overlay
 */
/** 左侧栏入口按钮。 */
export declare function HealthLauncher(props?: {
    wide?: boolean;
}): import("react").JSX.Element;
/** 独立健康界面（全屏层）。 */
export declare function HealthOverlay(): import("react").JSX.Element | null;
