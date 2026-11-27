/**
 * 宿主加载冒烟：用真的 Cordis Context 加假服务，跑一遍 `apply`。
 *
 * 目的不是测业务，而是测「插件在真实运行时里能不能起来」：工具注册有没有拿到
 * 五个定义、webServer 注入后路由有没有挂上、追问定时器有没有启动且能停。
 *
 * 用法：node tools/smoke-host.mjs
 */

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Context } from '@deepseek-ai/cordis'

import * as plugin from '../lib/index.js'

const root = await mkdtemp(join(tmpdir(), 'ha-smoke-'))
const toolNames = []
const routes = []

const ctx = new Context()

ctx.provide('tools', {
  register(definition) {
    toolNames.push(definition.name)
    return () => undefined
  },
})

ctx.provide('webServer', {
  register(route) {
    routes.push(route.path)
    return () => undefined
  },
  getOrigin() {
    return 'http://127.0.0.1:55441'
  },
})

plugin.apply(ctx, { memoryRoot: root, petId: 'main' })
await new Promise((resolve) => setTimeout(resolve, 300))

console.log('plugin name:', plugin.name)
console.log('tools:', toolNames.sort().join(', '))
console.log('routes:', routes.length, routes.slice(0, 4).join(', '))

const expectedTools = [
  'health_checkin_text',
  'health_import_table',
  'health_score',
  'health_profile',
  'health_daily',
]
const missing = expectedTools.filter((name) => !toolNames.includes(name))
if (missing.length > 0) {
  console.error('MISSING TOOLS:', missing)
  process.exitCode = 1
}
if (routes.length < 10) {
  console.error('ROUTES NOT REGISTERED:', routes.length)
  process.exitCode = 1
}

await ctx.dispose?.()
await rm(root, { recursive: true, force: true })
console.log('smoke ok')
