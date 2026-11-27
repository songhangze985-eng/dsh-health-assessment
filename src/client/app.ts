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

import { HealthNavIcon, HealthView } from './health.js'
import { injectStyles } from './styles.js'

/** 导航项与视图的稳定 id；三处注册必须一致。 */
const ID = 'health-assessment'

/** 排序：排在对话之后、设置相关面板之前。 */
const ORDER = 24

/** 面板运行时要用的最小上下文。 */
interface PanelContext {
  get?: (name: string) => unknown
  slots: {
    inject(name: string, generator: () => Generator<unknown, void, unknown>): void
    register(
      registration: Record<string, unknown>,
      component: (props?: Record<string, unknown>) => unknown,
    ): () => void
  }
  effect?: (fn: () => () => void, label?: string) => void
}

/**
 * 创建 DSH 插件 factory。
 *
 * @returns `(require) => module`，`require` 由宿主模块系统注入。
 */
export function makeFactory(): (require: (mod: string) => unknown) => unknown {
  return (require) => {
    const module = { exports: {} as Record<string, unknown> }
    const runtime = require('react/jsx-runtime') as {
      jsx: (type: unknown, props: unknown, key?: unknown) => unknown
    }

    /** 心形图标组件（左栏导航用）。 */
    const NavIcon = () => runtime.jsx(HealthNavIcon, {})
    /** 主视图组件。 */
    const View = () => runtime.jsx(HealthView, {})

    /** 注册全部原生入口；返回注销函数。 */
    function registerEntries(ctx: PanelContext): () => void {
      const disposers: (() => void)[] = []

      // 1) 主工作区视图：key 即面板 id，子槽承载真正内容。
      ctx.slots.inject('main', function* registerMain() {
        yield ctx.slots.register(
          {
            name: 'main',
            key: ID,
            children: { [`main.${ID}`]: { kind: 'single', scope: 'session-maybe' } },
          },
          (props?: Record<string, unknown>) => {
            const renderSlot = props?.renderSlot as
              | ((name: string, props: Record<string, unknown>) => unknown)
              | undefined
            return renderSlot ? renderSlot(`main.${ID}`, {}) : runtime.jsx(HealthView, {})
          },
        )
        yield ctx.slots.register({ name: `main.${ID}` }, View)
      })

      // 2) 主区顶部视图切换项。
      ctx.slots.inject('conversation.view', function* registerView() {
        yield ctx.slots.register(
          { name: 'conversation.view', id: ID, order: ORDER, label: () => '健康评估' },
          View,
        )
      })

      // 3) 左侧主导航项。
      ctx.slots.inject('sidebar.panellist', function* registerNav() {
        yield ctx.slots.register(
          { name: 'sidebar.panellist', id: ID, order: ORDER, label: () => '健康评估' },
          NavIcon,
        )
      })

      return () => {
        for (const dispose of disposers.reverse()) dispose()
      }
    }

    const name = 'dsh-health-assessment'
    const inject = ['slots']

    /** 插件主体（浏览器侧）。 */
    function apply(ctx: PanelContext): void {
      injectStyles()
      const dispose = registerEntries(ctx)
      ctx.effect?.(() => () => dispose(), 'dsh-health-assessment: native entries')
    }

    module.exports = { name, inject, apply }
    return module.exports
  }
}
