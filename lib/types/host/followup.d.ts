/**
 * 每日追问与升级提醒。
 *
 * 三条规则：
 * 1. 当天首次打开（或到点）→ 在指定工作区开一个新会话，让它问今天还差什么；
 * 2. 追问后 `escalateHours` 小时仍没回复 → 再开一个会话，把话说明白；
 * 3. 出分（或分数变动 ≥5）→ 投一次宠物气泡，每天最多一次。
 *
 * 所有「今天已经做过」的事实都落在 `followup.json`，进程重启不会重复轰炸。
 *
 * @module dsh-health-assessment/src/host/followup
 */
import type { Context } from '@deepseek-ai/cordis';
import type { PetBridge } from './pet.js';
import type { HealthService } from './service.js';
import type { FollowUpState, HealthStore } from './store.js';
/** 追问管理器。 */
export declare class FollowUpManager {
    private readonly ctx;
    private readonly store;
    private readonly service;
    private readonly pet;
    private timer;
    private running;
    constructor(ctx: Context, store: HealthStore, service: HealthService, pet: PetBridge);
    /** 启动周期检查，并立刻跑一次（覆盖「首次打开」）。 */
    start(): () => void;
    /** 一次检查：先看播报，再看追问。 */
    tick(): Promise<void>;
    /** 读追问状态（面板展示用）。 */
    state(): Promise<FollowUpState & {
        pendingBubble: string;
    }>;
    /** 记录用户已回复。 */
    markReply(): Promise<void>;
    /** 清掉待投喂气泡（客户端已投递）。 */
    ackPet(): Promise<void>;
    /** 手动投喂一条。 */
    say(text: string): Promise<void>;
    /**
     * 出分播报：只在「刚满 7 天」或「分数变动 ≥5」时排一条气泡。
     *
     * 这里只写 `pendingBubble`，真正投喂由浏览器侧完成——宿主不需要知道 web 端口，
     * 也避免在无 GUI 的场景里空转。
     */
    evaluateBroadcast(): Promise<void>;
    private maybeBroadcast;
    private maybeAsk;
    /** `HH:MM` 是否已到；空值表示随时可问（由「首次打开」触发）。 */
    private scheduleReached;
    /** 追问文案：最多列三项缺项。 */
    private askText;
    /**
     * 开一个新会话并发一条追问。
     *
     * 用 `ctx.agents.create` + `followup`：这是宿主里唯一受支持的「新建会话并驱动」路径。
     * 拿不到 agents 服务、或创建被拒时返回 false，由调用方退回面板提示。
     */
    private openAskSession;
}
