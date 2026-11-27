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
import { randomUUID } from 'node:crypto';
import { localDay } from './store.js';
/** 检查间隔：十分钟一次足够覆盖「打开」与「到点」两种触发。 */
const TICK_MS = 10 * 60 * 1000;
/** 分数变动多少才值得播报。 */
const PET_SCORE_DELTA = 5;
/** 追问文案里最多列几项缺项。 */
const MAX_GAP_ITEMS = 3;
/** 追问管理器。 */
export class FollowUpManager {
    ctx;
    store;
    service;
    pet;
    timer = null;
    running = false;
    constructor(ctx, store, service, pet) {
        this.ctx = ctx;
        this.store = store;
        this.service = service;
        this.pet = pet;
    }
    /** 启动周期检查，并立刻跑一次（覆盖「首次打开」）。 */
    start() {
        const tick = () => {
            void this.tick();
        };
        tick();
        this.timer = setInterval(tick, TICK_MS);
        if (typeof this.timer === 'object' && this.timer && 'unref' in this.timer) {
            ;
            this.timer.unref();
        }
        return () => {
            if (this.timer)
                clearInterval(this.timer);
            this.timer = null;
        };
    }
    /** 一次检查：先看播报，再看追问。 */
    async tick() {
        if (this.running)
            return;
        this.running = true;
        try {
            const settings = await this.service.settings();
            if (!settings.dailyAskEnabled && !settings.petEnabled)
                return;
            const state = await this.store.loadFollowUp();
            if (settings.petEnabled)
                await this.maybeBroadcast(state);
            if (settings.dailyAskEnabled)
                await this.maybeAsk(state);
        }
        catch {
            // 追问是加分项：任何失败都不该冒泡到宿主日志之外。
        }
        finally {
            this.running = false;
        }
    }
    /** 读追问状态（面板展示用）。 */
    async state() {
        return this.store.loadFollowUp();
    }
    /** 记录用户已回复。 */
    async markReply() {
        const state = await this.store.loadFollowUp();
        state.lastReplyAt = Date.now();
        state.pendingBubble = '';
        await this.store.saveFollowUp(state);
    }
    /** 清掉待投喂气泡（客户端已投递）。 */
    async ackPet() {
        const state = await this.store.loadFollowUp();
        state.pendingBubble = '';
        await this.store.saveFollowUp(state);
    }
    /** 手动投喂一条。 */
    async say(text) {
        await this.pet.say(text);
    }
    /**
     * 出分播报：只在「刚满 7 天」或「分数变动 ≥5」时排一条气泡。
     *
     * 这里只写 `pendingBubble`，真正投喂由浏览器侧完成——宿主不需要知道 web 端口，
     * 也避免在无 GUI 的场景里空转。
     */
    async evaluateBroadcast() {
        const state = await this.store.loadFollowUp();
        await this.maybeBroadcast(state);
    }
    async maybeBroadcast(state) {
        const settings = await this.service.settings();
        if (!settings.petEnabled)
            return;
        const score = await this.service.score();
        const total = score.scores?.total?.score ?? null;
        const today = localDay();
        if (total === null)
            return;
        const dayStart = new Date(`${today}T00:00:00`).getTime();
        if (state.lastPetAt >= dayStart)
            return;
        const changed = state.lastPetScore === null || Math.abs(total - state.lastPetScore) >= PET_SCORE_DELTA;
        if (!changed)
            return;
        state.pendingBubble = score.mode === 'scored'
            ? `满 7 天：${total}/200 分`
            : `这一窗合计 ${total}/200 分`;
        state.lastPetAt = Date.now();
        state.lastPetScore = total;
        await this.store.saveFollowUp(state);
    }
    async maybeAsk(state) {
        const settings = await this.service.settings();
        const now = Date.now();
        const today = localDay();
        const askedToday = state.lastAskDate === today;
        const scheduleReached = this.scheduleReached(settings.dailyAskTime);
        if (!askedToday && scheduleReached) {
            const daily = await this.service.daily(today);
            const text = this.askText(daily);
            const opened = await this.openAskSession(text, settings.dailyAskWorkspace);
            state.lastAskDate = today;
            state.lastAskAt = now;
            state.lastReplyAt = 0;
            if (!opened)
                state.pendingBubble = text;
            await this.store.saveFollowUp(state);
            return;
        }
        if (!askedToday || !state.lastAskAt)
            return;
        const unanswered = state.lastReplyAt < state.lastAskAt;
        const overdue = now - state.lastAskAt >= Math.max(1, settings.escalateHours) * 3600 * 1000;
        if (!unanswered || !overdue || state.escalatedDates.includes(today))
            return;
        const daily = await this.service.daily(today);
        const text = `已经问过一次还没等到回复：${this.askText(daily, false)}`;
        const opened = await this.openAskSession(text, settings.dailyAskWorkspace);
        state.escalatedDates = [...state.escalatedDates.filter((day) => day !== today), today].slice(-30);
        state.lastAskAt = now;
        if (!opened)
            state.pendingBubble = text;
        await this.store.saveFollowUp(state);
    }
    /** `HH:MM` 是否已到；空值表示随时可问（由「首次打开」触发）。 */
    scheduleReached(time) {
        if (!time)
            return true;
        const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
        if (!match)
            return true;
        const now = new Date();
        const minutes = Number(match[1]) * 60 + Number(match[2]);
        return now.getHours() * 60 + now.getMinutes() >= minutes;
    }
    /** 追问文案：最多列三项缺项。 */
    askText(daily, greet = true) {
        const missing = daily.missing_required_fields.slice(0, MAX_GAP_ITEMS);
        const prefix = greet ? '今天的健康打卡还差：' : '还差：';
        if (missing.length === 0)
            return '今天的必填都齐了，要不要顺手记一条选填（睡眠、压力、注意力）？';
        return `${prefix}${missing.join('；')}。用一句话告诉我今天的情况就行。`;
    }
    /**
     * 开一个新会话并发一条追问。
     *
     * 用 `ctx.agents.create` + `followup`：这是宿主里唯一受支持的「新建会话并驱动」路径。
     * 拿不到 agents 服务、或创建被拒时返回 false，由调用方退回面板提示。
     */
    async openAskSession(text, workspace) {
        const ctx = this.ctx;
        const agents = ctx.get?.('agents');
        if (!agents?.create)
            return false;
        const selection = ctx.agentDefaultModel?.currentSelection?.() ?? {};
        const sessionId = randomUUID();
        try {
            const handle = await agents.create({
                sessionId,
                agentOptions: selection.provider && selection.model
                    ? { provider: selection.provider, model: selection.model }
                    : undefined,
                cwd: workspace || undefined,
            });
            const message = workspace ? `${text}\n（工作区：${workspace}）` : text;
            await handle.agent?.followup?.({
                content: [{ type: 'text', text: message }],
                source: { kind: 'health-assessment' },
            });
            return true;
        }
        catch {
            return false;
        }
    }
}
