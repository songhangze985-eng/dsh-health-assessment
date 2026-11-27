/**
 * 浏览器半侧装配：把「健康」注册成 DSH 右侧栏的一种页签。
 *
 * 右侧栏是可选能力：没有 `sidebarRightTabs` 服务时只告警、不注册，
 * 插件其余部分照常工作——一个面板失败不该让整个插件加载失败。
 *
 * @module dsh-health-assessment/src/client/app
 */

import { HealthPanel } from './panel.js'
import { injectStyles } from './styles.js'

/** 页签身份；同时是正文插槽的 key。 */
export const TAB_ID = 'health-assessment'
/** 页签类型；`openTab` 按它打开。 */
export const TAB_KIND = 'health'

/** 右侧栏注册表的最小形状（只声明用到的成员）。 */
interface SidebarTabRegistry {
  register(definition: {
    readonly id: string
    readonly kind: string
    readonly priority: 'extension'
    readonly title: () => string
    readonly guide: readonly {
      id: string
      order: number
      title: () => string
      description?: () => string
      icon?: () => unknown
      commandId?: string
    }[]
  }): () => void
}

/** 面板运行时要用的最小上下文。 */
interface PanelContext {
  get?: (name: string) => unknown
  slots: {
    inject(name: string, generator: () => Generator<unknown, void, unknown>): void
    register(registration: { name: string; key: string; order: number }, component: () => unknown): () => void
  }
  effect?: (fn: () => () => void, label?: string) => void
}

/**
 * 创建 DSH 插件 factory。
 *
 * 返回 `(require) => module`：`require` 由宿主模块系统注入（react / jsx-runtime 都是种子模块）。
 */
export function makeFactory(): (require: (mod: string) => unknown) => unknown {
  return (require) => {
    const module = { exports: {} as Record<string, unknown> }
    const runtime = require('react/jsx-runtime') as {
      jsx: (type: unknown, props: unknown, key?: unknown) => unknown
    }

    /** 注册页签；返回注销函数。 */
    function registerTab(ctx: PanelContext): () => void {
      const disposers: (() => void)[] = []
      const tabs = ctx.get?.('sidebarRightTabs') as SidebarTabRegistry | undefined
      if (tabs && typeof tabs.register === 'function') {
        disposers.push(tabs.register({
          id: TAB_ID,
          kind: TAB_KIND,
          priority: 'extension',
          title: () => '健康',
          guide: [{
            id: TAB_KIND,
            order: 520,
            title: () => '健康评估',
            description: () => '打卡、档案与 7 天评分',
          }],
        }))
      } else {
        console.warn('[dsh-health-assessment] 右侧栏不可用：没有 sidebarRightTabs 服务，健康页签未注册')
      }
      ctx.slots.inject('sidebar.right.pane.tab', function* registerPane() {
        yield ctx.slots.register(
          { name: 'sidebar.right.pane.tab', key: TAB_ID, order: 520 },
          () => runtime.jsx(HealthPanel, {}),
        )
      })
      return () => {
        for (const dispose of disposers.reverse()) dispose()
      }
    }

    const name = 'health-assessment'
    const inject = ['slots']

    /** 插件主体（浏览器侧）。 */
    function apply(ctx: PanelContext): void {
      injectStyles()
      const dispose = registerTab(ctx)
      ctx.effect?.(() => () => dispose(), 'dsh-health-assessment: sidebar tab')
    }

    module.exports = { name, inject, apply }
    return module.exports
  }
}
