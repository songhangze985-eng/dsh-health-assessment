/**
 * 界面验收台：把真实 `HealthView` 组件挂到一张独立页面上，stub 掉接口，
 * 供 headless Chrome 截图与量测。
 *
 * 用途只有验收：确认「全高铺满 / 无底部留白 / 设置是居中 Modal /
 * 中文标签不折行 / 未建档有补全入口」。它不参与插件运行时。
 *
 * 用法：tsx tools/build-ui-harness.mjs && open 生成的 demo.html
 */

import { build } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const outDir = join(root, 'tools', 'harness')
mkdirSync(outDir, { recursive: true })

/** 假数据：一份「未建档 + 今日全缺」的总览，最容易暴露空态问题。 */
const overview = {
  date: '2026-11-28',
  distinctDates: 3,
  redFlags: [],
  profileMissing: ['height_cm', 'weight_kg', 'age', 'sex', 'training_years', 'injury'],
  checklist: [
    { key: 'protein', label: '蛋白质摄入', hint: '写克数，例如「蛋白质 120g」', done: false, value: '' },
    { key: 'resistance', label: '抗阻训练', hint: '写训练内容或分钟数，例如「抗阻 45 分钟」', done: true, value: '45 分钟' },
    { key: 'overload', label: '渐进超负荷', hint: '写是否加重量或多做一组', done: false, value: '' },
    { key: 'rating', label: '执行力与心态自评', hint: '1–5 分，例如「状态 4 分」', done: true, value: '4 分' },
    { key: 'feedback', label: '外界评价处理', hint: '可测量就采纳，人身攻击就丢弃', done: false, value: '' },
  ],
  daily: { required_completion_ratio: 0.4 },
  score: {
    mode: 'blocked_profile',
    scores: {
      total: { score: null },
      body: { score: null },
      psych: { score: null },
    },
    next_steps: ['补齐建库字段后再记。缺的字段不能估算。'],
  },
  settings: { autoPromptOnOpen: true, dailyAskEnabled: true, escalateHours: 5, petEnabled: true, confirmImageUpload: true },
  profile: {},
}

const sessions = [
  { date: '2026-11-28', body_required: { resistance_minutes: 45 }, psych_required: { execution_likert: 4 } },
  { date: '2026-11-27', body_required: { protein_g: 130, resistance_done: true, progressive_overload: true }, psych_required: { execution_likert: 5, classification: 'kept_and_changed' } },
  { date: '2026-11-26', body_required: { protein_g: 120 }, psych_required: {} },
]

/** 生成入口脚本。 */
const entry = `
import { createRoot } from 'react-dom/client'
import { HealthView } from '../../src/client/health.tsx'
import { injectStyles } from '../../src/client/styles.ts'

// 宿主在 apply() 里注入样式；验收台必须做同样的事，否则量到的是无样式页面。
injectStyles()

const overview = ${JSON.stringify(overview)}
const sessions = ${JSON.stringify(sessions)}

const realFetch = globalThis.fetch
globalThis.fetch = async (input, init) => {
  const url = String(input)
  if (url.includes('/overview')) return new Response(JSON.stringify(overview), { status: 200 })
  if (url.includes('/sessions')) return new Response(JSON.stringify(sessions), { status: 200 })
  if (url.includes('/workspaces')) return new Response(JSON.stringify({ rows: [{ path: '/Users/zzz/Documents/deepseek-harness/default-workspace', name: 'default-workspace' }] }), { status: 200 })
  void realFetch
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}

createRoot(document.getElementById('root')).render(<HealthView />)
`

writeFileSync(join(outDir, 'entry.tsx'), entry)

await build({
  entryPoints: [join(outDir, 'entry.tsx')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  jsx: 'automatic',
  target: 'es2022',
  define: { 'process.env.NODE_ENV': '"production"' },
  outfile: join(outDir, 'app.js'),
  logLevel: 'error',
})

/** 样式：复用插件自己的样式注入，另外把宿主容器尺寸定下来。 */
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8" /><title>健康评估验收</title>
<style>
  html, body { margin: 0; height: 100%; background: #131416; color: #e7e8ea;
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }
  /* 模拟宿主主工作区：一块定高的容器，插件根必须铺满它 */
  #host { position: absolute; inset: 0; display: flex; }
  #root { flex: 1; min-width: 0; }
</style></head>
<body><div id="host"><div id="root"></div></div>
<script src="./app.js"></script>
<script>
// 验收度量：把关键几何与折行情况写进 #metrics，供 --dump-dom 读取。
setTimeout(function () {
  function rect(el) { return el ? el.getBoundingClientRect() : null }
  function px(v) { return Math.round(v) }
  var root = rect(document.querySelector('.ha-root'))
  var main = rect(document.querySelector('.ha-main'))
  var labels = [].map.call(
    document.querySelectorAll('.ha-row-label, .ha-bar-label, .ha-metric span, .ha-title, .ha-pill'),
    function (el) {
      var r = el.getBoundingClientRect()
      return { text: el.textContent, w: px(r.width), h: px(r.height), wrapped: r.height > 26 }
    },
  )
  var icons = [].map.call(document.querySelectorAll('.ha-icon'), function (b) {
    var r = b.getBoundingClientRect()
    var svg = b.querySelector('svg')
    var cs = getComputedStyle(b)
    return { w: px(r.width), h: px(r.height), display: cs.display, title: b.getAttribute('title'),
      svg: !!svg, svgSize: svg ? px(svg.getBoundingClientRect().width) : 0 }
  })
  var blocks = [].map.call(document.querySelectorAll('.ha-block'), function (b) {
    return px(b.getBoundingClientRect().height)
  })
  var out = {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    root: root && { w: px(root.width), h: px(root.height), bottom: px(root.bottom) },
    main: main && { h: px(main.height), bottom: px(main.bottom) },
    bottomGap: root ? px(window.innerHeight - root.bottom) : null,
    blockHeights: blocks,
    wrappedLabels: labels.filter(function (l) { return l.wrapped }),
    labels: labels,
    icons: icons,
    profileCta: !!document.querySelector('.ha-profile-cta'),
    heatCells: document.querySelectorAll('.ha-cell').length,
    checklistRows: document.querySelectorAll('.ha-row').length,
    ringText: (document.querySelector('.ha-ring-num') || {}).textContent,
  }
  var pre = document.createElement('pre')
  pre.id = 'metrics'
  pre.textContent = 'METRICS=' + JSON.stringify(out)
  document.body.appendChild(pre)
}, 1200)
</script>
</body></html>`

writeFileSync(join(outDir, 'demo.html'), html)
console.log(`harness → ${join(outDir, 'demo.html')}`)
