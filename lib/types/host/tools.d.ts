/**
 * 模型可见的五个工具：把「打卡、导入、看分、建档、看今日缺项」暴露成原生能力。
 *
 * 工具只做转发与参数校验；判分逻辑仍在 `scorePayload`，抽取逻辑仍在 service，
 * 这样对话里得到的数字与面板上看到的数字必然同源。
 *
 * @module dsh-health-assessment/src/host/tools
 */
import type { Context } from '@deepseek-ai/cordis';
import type { ScoreResult } from '../core/types.js';
import type { HealthService } from './service.js';
/** 摘要：只给模型看关键结论，不塞整份 JSON。 */
export declare function summarizeScore(result: ScoreResult): string;
/**
 * 注册全部健康工具。
 *
 * @param ctx - 宿主上下文（需要 `tools` 服务）。
 * @param service - 业务门面。
 */
export declare function registerTools(ctx: Context, service: HealthService): void;
