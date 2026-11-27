/**
 * 离线端到端：真 Cordis Context + 假 webServer，直接调用插件的 HTTP handler。
 *
 * 这条测试补的是「进程内到底能不能跑通」——包括未注入的服务必须软取这一点。
 * 它不依赖 DSH 重启，因此改动完就能验证。
 *
 * 用法：node tools/smoke-e2e.mjs
 */

import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import { Context } from '@deepseek-ai/cordis'

import * as plugin from '../lib/index.js'

const root = await mkdtemp(join(tmpdir(), 'ha-e2e-'))
const routes = new Map()
const ctx = new Context()

ctx.provide('tools', { register: () => () => undefined })
ctx.provide('webServer', {
  register(route) {
    routes.set(route.path, route.handler)
    return () => routes.delete(route.path)
  },
  getOrigin: () => 'http://127.0.0.1:55441',
})

plugin.apply(ctx, { memoryRoot: root, petId: 'main' })
await new Promise((resolve) => setTimeout(resolve, 200))

/** 造一个最小 IncomingMessage。 */
function makeRequest(method, url, body) {
  const stream = Readable.from([Buffer.from(body ?? '')])
  stream.method = method
  stream.url = url
  return stream
}

/** 收集响应。 */
function makeResponse() {
  const state = { status: 0, body: '' }
  return {
    state,
    writeHead(status) {
      state.status = status
    },
    end(chunk) {
      if (chunk) state.body += chunk.toString()
    },
  }
}

/** 调一条已注册的路由。 */
async function call(prefixPath, method, body) {
  const handler = routes.get(`/health-assessment-8221${prefixPath}`)
  if (!handler) throw new Error(`route missing: ${prefixPath}`)
  const res = makeResponse()
  await handler(makeRequest(method, `/health-assessment-8221${prefixPath}`, body), res)
  return { status: res.state.status, json: JSON.parse(res.state.body || '{}') }
}

const checks = []
const profile = await call('/profile', 'POST', JSON.stringify({
  height_cm: 172, weight_kg: 75, age: 36, sex: 'male', training_years: 0, injury: false,
}))
checks.push(['保存档案', profile.status === 200 && profile.json.profile?.weight_kg === 75])

const checkin = await call('/checkin/text', 'POST', JSON.stringify({
  text: '抗阻训练45分钟加了卧推重量，蛋白质140g，状态5分，听取建议改了动作，睡了8小时，不焦虑很专注',
  date: '2026-11-28',
}))
checks.push(['文字打卡', checkin.status === 200 && checkin.json.session?.date === '2026-11-28'])
checks.push(['来源标注为规则', checkin.json.source === 'rule'])

const overview = await call('/overview', 'GET')
checks.push(['总览可读', overview.status === 200 && overview.json.profile?.age === 36])
checks.push(['今日缺项收敛', Array.isArray(overview.json.daily?.missing_required_fields)])

const score = await call('/score', 'GET')
checks.push(['评估 mode 正常', ['under7', 'scored', 'redflag', 'blocked_profile'].includes(score.json.mode)])

const table = await call('/checkin/table', 'POST', JSON.stringify({
  csv: '日期,蛋白质(g),无氧训练(分钟),执行力自评,评价分类\n2026-11-27,110,30,4,kept_and_changed',
}))
checks.push(['CSV 导入', table.status === 200 && table.json.imported >= 1])

const files = await readdir(join(root, 'sessions'))
checks.push(['落盘到 sessions/', files.length >= 2])

const dayFile = JSON.parse(await readFile(join(root, 'sessions', '2026-11-28.json'), 'utf8'))
checks.push(['每日一份合并文件', Boolean(dayFile.body_required?.protein_g)])

const followup = await call('/followup', 'GET')
checks.push(['追问状态可读', followup.status === 200])
checks.push(['气泡字段存在', 'pendingBubble' in followup.json])

for (const [label, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
const failed = checks.filter(([, ok]) => !ok)
console.log(`passed ${checks.length - failed.length}/${checks.length}`)

await ctx.dispose?.()
await rm(root, { recursive: true, force: true })
if (failed.length > 0) process.exitCode = 1
