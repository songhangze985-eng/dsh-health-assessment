/**
 * 客户端注册冒烟：模拟宿主的 `__ModuleLoader__`，跑一遍 `apply`，
 * 检查是否只注册了三个原生入口（main / conversation.view / sidebar.panellist），
 * 并确认没有残留的悬浮层或 footer 按钮注册。
 *
 * 用法：node tools/smoke-client.mjs
 */

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const bundlePath = join(root, 'lib', 'client.js')
const source = readFileSync(bundlePath, 'utf8')

const require = createRequire(import.meta.url)
const registrations = []
const injected = []

const reactStub = {
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => undefined],
  useEffect: () => undefined,
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
}
const runtimeStub = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
}

globalThis.window = {
  __ModuleLoader__: {
    load(info) {
      const mod = info.factory((specifier) => {
        if (specifier === 'react') return reactStub
        if (specifier === 'react/jsx-runtime') return runtimeStub
        if (specifier === 'react-dom') return {}
        if (specifier === 'react-dom/client') return {}
        throw new Error(`unexpected require: ${specifier}`)
      })
      const ctx = {
        get: () => undefined,
        slots: {
          inject(name, generator) {
            injected.push(name)
            const iterator = generator()
            // 宿主会一直推进 generator 直到 done；每一步 yield 即一次注册。
            let step = iterator.next()
            while (!step.done) step = iterator.next()
          },
          register(registration, component) {
            registrations.push({ registration, componentType: typeof component })
            return () => undefined
          },
        },
        effect: (fn) => {
          fn()
        },
      }
      mod.apply(ctx)
    },
  },
}

// 让 bundle 里的 fetch 心跳不报错。
globalThis.fetch = () => Promise.resolve({ ok: true, text: () => Promise.resolve('{}') })

new Function(source)()

const names = registrations.map((item) => item.registration.name)
const ids = registrations.map((item) => item.registration.id ?? item.registration.key ?? '')

const checks = [
  ['注入 main / conversation.view / sidebar.panellist', ['main', 'conversation.view', 'sidebar.panellist'].every((name) => injected.includes(name))],
  ['注册了主视图子槽 main.health-assessment', names.includes('main.health-assessment')],
  ['注册了 sidebar.panellist 导航项', registrations.some((item) => item.registration.name === 'sidebar.panellist' && item.registration.id === 'health-assessment')],
  ['注册了 conversation.view 视图项', registrations.some((item) => item.registration.name === 'conversation.view' && item.registration.id === 'health-assessment')],
  ['没有 shell.overlay 悬浮层', !names.includes('shell.overlay')],
  ['没有 sidebar.footer.action 按钮', !names.includes('sidebar.footer.action')],
  ['没有 sidebar.right.pane.tab 页签', !names.includes('sidebar.right.pane.tab')],
]

for (const [label, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
console.log('registrations:', names.join(', '))
console.log('ids:', ids.join(', '))

const failed = checks.filter(([, ok]) => !ok)
if (failed.length > 0) process.exitCode = 1

// 顺带确认产物里没有注入式悬浮按钮。
const leftover = /ha-entry|position:fixed;left:12px/.test(source)
console.log(`${leftover ? 'FAIL' : 'ok  '} 产物里没有悬浮兜底按钮`)
if (leftover) process.exitCode = 1
void execSync
