/**
 * 浏览器半侧 bundle 入口：只导出工厂，不自己调 `__ModuleLoader__`。
 *
 * 由 `scripts/wrap-client.mjs` 包成 `loader.load({ factory })` 外壳——把「注册」
 * 留在 wrapper 里，bundle 只负责产出模块，这样重复加载同一份 bundle 也不会
 * 因为 CJS 模块缓存拿到空对象。
 *
 * @module dsh-health-assessment/src/client/index
 */
export { makeFactory } from './app.js';
