/**
 * 浏览器半侧装配：把「健康」注册成 DSH 右侧栏的一种页签。
 *
 * 右侧栏是可选能力：没有 `sidebarRightTabs` 服务时只告警、不注册，
 * 插件其余部分照常工作——一个面板失败不该让整个插件加载失败。
 *
 * @module dsh-health-assessment/src/client/app
 */
/** 页签身份；同时是正文插槽的 key。 */
export declare const TAB_ID = "health-assessment";
/** 页签类型；`openTab` 按它打开。 */
export declare const TAB_KIND = "health";
/**
 * 创建 DSH 插件 factory。
 *
 * 返回 `(require) => module`：`require` 由宿主模块系统注入（react / jsx-runtime 都是种子模块）。
 */
export declare function makeFactory(): (require: (mod: string) => unknown) => unknown;
