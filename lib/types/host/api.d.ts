/**
 * 面板与宿主之间的 JSON 路由。
 *
 * 用 `ctx.webServer` 的 handler 形态（面板需要 POST），前缀独立，避免与其他插件撞路径。
 * 只挂在 DSH GUI 的同一 origin 上，浏览器沿用既有登录态；不额外开放端口。
 *
 * @module dsh-health-assessment/src/host/api
 */
import type { Context } from '@deepseek-ai/cordis';
import type { HealthService } from './service.js';
import type { HealthStore } from './store.js';
/** 路由前缀；带插件特征后缀，防止与生态里的同名插件冲突。 */
export declare const API_PREFIX = "/health-assessment-8221";
/** 额外需要注入的宿主能力。 */
export interface ApiHooks {
    /** 手动投喂一次气泡。 */
    say?: (text: string) => Promise<void>;
    /** 标记用户已回复。 */
    markReply?: () => Promise<void>;
    /** 取追问状态。 */
    followUp?: () => Promise<unknown>;
    /** 清掉待投喂气泡。 */
    ackPet?: () => Promise<void>;
    /** 立刻追问一次并返回诊断。 */
    askNow?: () => Promise<unknown>;
    /** 浏览器侧插件加载后的心跳；stage 区分 boot / apply，error 带错误文本。 */
    clientHello?: (stage: string, error?: string) => Promise<void>;
}
/**
 * 注册全部路由。
 *
 * @param ctx - 宿主上下文（需要 `webServer`）。
 * @param service - 业务门面。
 * @param store - 记忆库（日历视图直接读文件列表）。
 * @param hooks - 宠物与追问的钩子。
 * @returns 注销函数。
 */
export declare function registerApi(ctx: Context, service: HealthService, store: HealthStore, hooks?: ApiHooks): () => void;
