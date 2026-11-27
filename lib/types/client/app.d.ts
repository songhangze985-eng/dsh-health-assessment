/**
 * 浏览器半侧装配：把「健康评估」挂成宿主原生导航项与主工作区视图。
 *
 * 三段注册缺一不可（照宿主 `dsh-daily-flashcard` 的真实用法）：
 * 1. `sidebar.panellist` —— 左侧导航里的图标项，与 Purge / 知识库同级；
 * 2. `main`（key + 子槽 `main.<id>`）—— 点击后替换主工作区内容的视图容器；
 * 3. `conversation.view` —— 主区顶部的视图切换项，与「对话」并列。
 *
 * 不再注册任何悬浮层、footer 按钮或 index 注入：入口只走宿主原生导航。
 *
 * @module dsh-health-assessment/src/client/app
 */
/**
 * 创建 DSH 插件 factory。
 *
 * @returns `(require) => module`，`require` 由宿主模块系统注入。
 */
export declare function makeFactory(): (require: (mod: string) => unknown) => unknown;
