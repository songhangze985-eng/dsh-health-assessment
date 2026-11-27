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

const wrapped = `/* dsh-health-assessment 浏览器半侧：由 scripts/wrap-client.mjs 生成，请勿手改 */
(function () {
  var loader = window.__ModuleLoader__;
  if (!loader || typeof loader.load !== 'function') {
    console.warn('[dsh-health-assessment] 没有 __ModuleLoader__，面板无法加载');
    return;
  }
  /** 模块本体：只导出 makeFactory，不含任何副作用。 */
  var bundle = (function () {
    var module = { exports: {} };
    var exports = module.exports;
    (function (module, exports, require) {
${bundle}
    })(module, exports, require);
    return module.exports;
  })();
  loader.load({
    id: 'dsh-health-assessment',
    factory: function (require) {
      return bundle.makeFactory()(require);
    }
  });
})();
`

writeFileSync(outputPath, wrapped)
rmSync(bundlePath, { force: true })
console.log(`client bundle → ${outputPath}`)
