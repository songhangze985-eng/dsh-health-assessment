/**
 * 把 esbuild 的 CJS 产物包成 DSH 的 `__ModuleLoader__.load({ factory })` 外壳。
 *
 * 为什么要包：DSH 的浏览器插件不是普通 ES 模块，而是「factory(require) 返回模块」
 * 的闭包——react 等种子模块由宿主注入，bundle 里不能自带。esbuild 的 `--format=cjs`
 * 保留了 `require('react')` 调用，正好可以在这里接上。
 *
 * 用法：node scripts/wrap-client.mjs
 */

import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const bundlePath = join(root, 'lib', 'client.bundle.cjs')
const outputPath = join(root, 'lib', 'client.js')

const bundle = readFileSync(bundlePath, 'utf8')
// 模块 id 必须等于 cordis.patch.yml 里的 entry id：client-modules 用 entry.id
// 给每个组合脚本命名，bundle 注册的 id 与它对不上就会被静默跳过。
const ENTRY_ID = 'dsh-health-assessment'

const wrapped = `/* dsh-health-assessment 浏览器半侧：由 scripts/wrap-client.mjs 生成，请勿手改 */
(function () {
  var loader = window.__ModuleLoader__;
  if (!loader || typeof loader.load !== 'function') {
    console.warn('[dsh-health-assessment] 没有 __ModuleLoader__，面板无法加载');
    return;
  }
  // 第一段心跳：bundle 顶层就发，证明浏览器真的下载并执行了这个文件。
  try {
    fetch('/health-assessment-8221/client-hello', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'boot' })
    }).catch(function () {});
  } catch (e) {}

  /**
   * 模块本体：包成 function (require)，每次 factory 调用时再执行。
   * 之前直接在外层求值，导致 bundle 里的 require(...) 在无 require 的作用域运行，
   * 一执行就 ReferenceError——于是 boot 心跳有值、apply 永远不跑。
   */
  function loadBundle(require) {
    var module = { exports: {} };
    var exports = module.exports;
    (function (module, exports, require) {
${bundle}
    })(module, exports, require);
    return module.exports;
  }

  loader.load({
    id: '${ENTRY_ID}',
    factory: function (require) {
      var mod = loadBundle(require).makeFactory()(require);
      var originalApply = mod.apply;
      mod.apply = function (ctx) {
        try {
          originalApply(ctx);
          fetch('/health-assessment-8221/client-hello', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: 'apply' })
          }).catch(function () {});
        } catch (error) {
          fetch('/health-assessment-8221/client-hello', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: 'apply', error: String(error && error.stack || error) })
          }).catch(function () {});
          throw error;
        }
      };
      return mod;
    }
  });
})();
`

writeFileSync(outputPath, wrapped)
rmSync(bundlePath, { force: true })
console.log(`client bundle → ${outputPath}`)
