/**
 * 业务层：把「记忆库 + 计分内核 + 抽取」拼成面板与工具都用得上的少量动作。
 *
 * 这里不含 HTTP、不含工具描述、不含 React；宿主入口负责接线。
 * 所有写操作都经 `HealthStore`，所有分数都来自 `scorePayload`——本层不做第二套算术。
 *
 * @module dsh-health-assessment/src/host/service
 */
import { heuristicExtract, rowsToSessions, attachKnownFlags } from '../core/extract.js';
import { parseCsv } from '../core/csv.js';
import { collectRedFlags, computeCalendarSpan, dailyChecklist, inspectDailyGaps, scorePayload } from '../core/score.js';
import { localDay } from './store.js';
/** 结构化抽取的系统提示词（移植自上游 `EXTRACTION_SYSTEM_PROMPT`）。 */
export const EXTRACTION_SYSTEM_PROMPT = `你是健康打卡的结构化提取器。
把用户自述或图片里已经出现的内容提取成 JSON。不要计算分数，不要编造没提到的数字，不要下诊断。
红旗只在原文确实出现胸痛、昏厥、晕厥、自伤、轻生、自行停药、急性剧痛、呼吸困难、异常心悸、骨裂、关节急性肿胀时写入 red_flags。
输出 JSON:
{
  "date": "YYYY-MM-DD",
  "red_flags": [],
  "body_required": {"protein_g": null, "resistance_done": null, "progressive_overload": null},
  "psych_required": {"self_rating_1_to_5": null, "feedback_category": null},
  "optional": {"sleep_quality": null, "anti_inflammatory_diet": null, "stress_relief": null, "focus_state": null},
  "pet_reply": "30字以内的桌宠回应，不给医疗建议"
}`;
/** 正文截断：模型输入不无限增长。 */
const MAX_TEXT = 4000;
/** 模型调用超时（毫秒）；超时即降级规则。 */
const MODEL_TIMEOUT_MS = 20_000;
/** 从模型输出里剥掉 ```json 围栏。 */
export function stripJsonFence(content) {
    let text = content.trim();
    if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?/, '').trim().replace(/```$/, '').trim();
    }
    return text;
}
/** 把模型返回的 JSON 收敛成一条打卡记录。 */
function normalizeModelOutput(raw, text, targetDate) {
    if (!raw || typeof raw !== 'object')
        return null;
    const record = raw;
    const session = {
        date: String(record.date ?? targetDate).slice(0, 10),
        raw_text: text,
        red_flags: Array.isArray(record.red_flags) ? record.red_flags : [],
        body_required: record.body_required ?? {},
        psych_required: record.psych_required ?? {},
        optional: record.optional ?? {},
    };
    return attachKnownFlags(session);
}
/** 是否已经写下了足够的必填字段（不够才需要模型补）。 */
function needsModel(session) {
    const body = (session.body_required ?? {});
    const psych = (session.psych_required ?? {});
    const hasProtein = ['protein_g', 'protein_ratio', 'protein_likert'].some((key) => body[key] !== null && body[key] !== undefined);
    const hasResistance = ['resistance_sets', 'resistance_likert', 'resistance_done', 'resistance_minutes']
        .some((key) => body[key] !== null && body[key] !== undefined);
    const hasOverload = ['overload', 'progressive_overload', 'overload_likert']
        .some((key) => body[key] !== null && body[key] !== undefined);
    const hasRating = ['execution_likert', 'self_rating_1_to_5', 'likert']
        .some((key) => psych[key] !== null && psych[key] !== undefined);
    const hasFeedback = Boolean(psych.classification || psych.feedback_category);
    return !(hasProtein && hasResistance && hasOverload && hasRating && hasFeedback);
}
/**
 * 健康评估的业务门面。
 *
 * 一个实例绑定一个记忆库目录；设置与追问状态都落在库里，因此换库即换全套状态。
 */
export class HealthService {
    /** 记忆库。 */
    store;
    host;
    settingsCache = null;
    constructor(store, host = {}) {
        this.store = store;
        this.host = host;
    }
    /** 读设置（带缓存）。 */
    async settings(force = false) {
        if (!this.settingsCache || force)
            this.settingsCache = await this.store.loadSettings();
        return this.settingsCache;
    }
    /** 写设置并刷新缓存。 */
    async saveSettings(patch) {
        this.settingsCache = await this.store.saveSettings(patch);
        return this.settingsCache;
    }
    /** 读档案。 */
    async profile() {
        return this.store.loadProfile();
    }
    /** 写档案。 */
    async saveProfile(profile) {
        return this.store.saveProfile(profile);
    }
    /** 当前评估（全量记录，默认窗口由计分器按「满 7 天」规则处理）。 */
    async score(payload) {
        const [profile, sessions] = await Promise.all([this.store.loadProfile(), this.store.loadSessions()]);
        const input = { profile, sessions };
        if (payload?.window)
            input.window = payload.window;
        return scorePayload(input);
    }
    /** 今日进度（缺项、完成度、已写选填）。 */
    async daily(date = localDay()) {
        const sessions = await this.store.loadSessions();
        return inspectDailyGaps(sessions, date);
    }
    /** 汇总状态：面板首屏一次拿全。 */
    async overview(selectedDate) {
        const date = selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate) ? selectedDate : localDay();
        const [profile, sessions, settings] = await Promise.all([
            this.store.loadProfile(),
            this.store.loadSessions(),
            this.settings(),
        ]);
        const score = scorePayload({ profile, sessions });
        const [distinctDates] = computeCalendarSpan(sessions);
        return {
            date,
            profile,
            profileMissing: (score.mode === 'blocked_profile' ? score.missing_profile : []) ?? [],
            daily: inspectDailyGaps(sessions, date),
            checklist: dailyChecklist(sessions, date),
            score,
            distinctDates,
            redFlags: collectRedFlags(sessions),
            settings,
        };
    }
    /**
     * 一句话打卡。
     *
     * 规则先跑；规则没写全且配了模型时再请模型补。模型失败不阻塞打卡——
     * 规则结果照常入库，只在返回值里标 warning。
     */
    async submitText(input) {
        const text = String(input.text ?? '').trim();
        if (!text)
            throw new Error('打卡内容不能为空。');
        const date = input.date ? input.date : localDay();
        let session = heuristicExtract(text.slice(0, MAX_TEXT), date);
        let source = 'rule';
        let warning = '';
        if (needsModel(session)) {
            const settings = await this.settings();
            const extracted = await this.callModel(text, date, settings);
            if (extracted.session) {
                session = mergeExtraction(session, extracted.session);
                source = 'model';
                warning = extracted.warning;
            }
            else {
                warning = extracted.warning;
            }
        }
        session = attachKnownFlags(session);
        const merged = await this.store.mergeAndSaveSession(session, input.source ?? 'self_report');
        return { session: merged, source, warning };
    }
    /** 表格导入（CSV 文本或已解析的行）。 */
    async submitTable(input) {
        const rows = input.rows ?? (input.csv ? parseCsv(input.csv) : []);
        if (rows.length === 0)
            throw new Error('表格里没有可识别的行。');
        const parsed = rowsToSessions(rows, input.date ?? null);
        if (parsed.length === 0)
            throw new Error('表格里没有认得的列，请确认表头。');
        const saved = [];
        for (const session of parsed) {
            saved.push(await this.store.mergeAndSaveSession(session, 'wearable_table'));
        }
        return {
            sessions: saved,
            imported: saved.length,
            redFlags: collectRedFlags(saved),
        };
    }
    /**
     * 图片导入：先存附件，再请视觉模型读成结构化记录。
     *
     * 没配模型或没视觉能力时不猜——直接抛错说明缺什么，避免把「未识别」当「没摄入」。
     */
    async submitImage(input) {
        const settings = await this.settings();
        const date = input.date ?? localDay();
        if (!this.host.streamText || !this.host.saveImage) {
            throw new Error('当前宿主没有可用的视觉抽取能力；请改传 CSV 或改用文字打卡。');
        }
        const selection = this.resolveModel(settings);
        if (!selection)
            throw new Error('还没有指定抽取模型：请在插件设置里选择 provider 与模型。');
        const attachment = await this.host.saveImage(input.base64, input.mediaType, input.name ?? 'checkin-image');
        const note = String(input.note ?? '').slice(0, MAX_TEXT);
        const raw = await this.callStream({
            provider: selection.provider,
            model: selection.model,
            text: note || '请读取这张图片里的健康记录内容。',
            image: attachment,
        });
        const parsed = this.parseModelJson(raw);
        const session = normalizeModelOutput(parsed, note, date);
        if (!session)
            throw new Error('图片没有读出可用的结构化内容；请补一句文字说明再试。');
        const merged = await this.store.mergeAndSaveSession(session, 'image_ocr');
        return { session: merged, source: 'image', warning: '' };
    }
    /** 从旧记忆库导入。 */
    async importLibrary(sourceRoot) {
        return this.store.importFrom(sourceRoot);
    }
    /** 当前生效的模型选择：设置优先，其次 DSH 默认。 */
    resolveModel(settings) {
        if (settings.extractionProvider && settings.extractionModel) {
            return { provider: settings.extractionProvider, model: settings.extractionModel };
        }
        const fallback = this.host.defaultSelection?.();
        if (fallback?.provider && fallback.model)
            return fallback;
        return null;
    }
    /** 调模型并解析；任何失败都降级为规则并给出说明。 */
    async callModel(text, date, settings) {
        const selection = this.resolveModel(settings);
        if (!selection || !this.host.streamText) {
            return { session: null, warning: '没有可用的抽取模型，已只用本地规则。' };
        }
        try {
            const raw = await this.callStream({
                provider: selection.provider,
                model: selection.model,
                text: `打卡日期: ${date}\n用户自述: ${text}`,
            });
            const parsed = this.parseModelJson(raw);
            const session = normalizeModelOutput(parsed, text, date);
            if (!session)
                return { session: null, warning: '模型返回的不是对象，已只用本地规则。' };
            return { session, warning: '' };
        }
        catch (error) {
            return {
                session: null,
                warning: `模型抽取失败，已只用本地规则：${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }
    /** 带超时的模型调用。 */
    async callStream(options) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
        try {
            return await this.host.streamText({
                ...options,
                system: EXTRACTION_SYSTEM_PROMPT,
                signal: controller.signal,
            });
        }
        finally {
            clearTimeout(timer);
        }
    }
    /** 解析模型 JSON；失败返回 null。 */
    parseModelJson(raw) {
        try {
            const parsed = JSON.parse(stripJsonFence(raw));
            return parsed && typeof parsed === 'object' ? parsed : null;
        }
        catch {
            return null;
        }
    }
}
/**
 * 规则结果与模型结果合并：模型只补规则没写的字段，不覆盖已写值。
 *
 * 这条规则是为了让「用户写明的数字」永远赢过模型猜测。
 */
export function mergeExtraction(rule, model) {
    const merged = { ...rule };
    for (const field of ['body_required', 'psych_required', 'optional']) {
        const current = { ...(rule[field] ?? {}) };
        for (const [key, value] of Object.entries(model[field] ?? {})) {
            if (value === null || value === undefined || value === '')
                continue;
            if (current[key] === null || current[key] === undefined || current[key] === '')
                current[key] = value;
        }
        ;
        merged[field] = current;
    }
    const flags = new Set([...(rule.red_flags ?? []), ...(model.red_flags ?? [])].map((flag) => String(flag)));
    merged.red_flags = [...flags];
    if (!merged.raw_text && model.raw_text)
        merged.raw_text = model.raw_text;
    return merged;
}
