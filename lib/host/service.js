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
import * as XLSX from 'xlsx';
import { collectRedFlags, computeCalendarSpan, dailyChecklist, inspectDailyGaps, scorePayload } from '../core/score.js';
import { OPTIONAL_INDEX, OPTIONAL_ITEMS } from '../core/optional-catalog.js';
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
/**
 * 清洗模型输出：去掉工具调用标记、思考标签与多余空白。
 *
 * 视觉模型有时会把 `vision_describe` 之类的调用写成纯文本（DSML / XML 风格），
 * 这段标记对结构化抽取毫无意义，留着会污染 raw_text 并误导下游。
 */
export function cleanModelText(raw) {
    return raw
        .replace(/<[｜|]{2}[\s\S]*?[｜|]{2}>/g, ' ')
        .replace(/<\|?\|?DSML[\s\S]*?\/\|?\|?DSML[\s\S]*?>/gi, ' ')
        .replace(/<\/?[a-zA-Z_][\w-]*(\s[^>]*)?>/g, ' ')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
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
            optional: (() => {
                const merged = {};
                for (const session of sessions) {
                    if (session.date !== date)
                        continue;
                    Object.assign(merged, session.optional ?? {});
                }
                return {
                    written: merged,
                    bodyCount: OPTIONAL_ITEMS.filter((i) => i.side === 'body' && merged[i.key] != null).length,
                    psychCount: OPTIONAL_ITEMS.filter((i) => i.side === 'psych' && merged[i.key] != null).length,
                };
            })(),
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
    /**
     * Excel / CSV 文件 → 行对象。
     *
     * `.csv` 走文本解析；其余按 Excel 处理（xlsx 读第一个工作表）。
     */
    parseTableFile(base64, filename) {
        const lower = filename.toLowerCase();
        if (lower.endsWith('.csv') || lower.endsWith('.txt')) {
            const text = Buffer.from(base64, 'base64').toString('utf8');
            return parseCsv(text);
        }
        const buffer = Buffer.from(base64, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName)
            throw new Error('这个 Excel 里没有工作表。');
        const sheet = workbook.Sheets[sheetName];
        if (!sheet)
            throw new Error('读不到第一个工作表。');
        return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    }
    /** 表格导入（CSV 文本、已解析的行，或 base64 文件）。 */
    async submitTable(input) {
        // 三种来源按优先级取第一个真正有内容的：已解析行 > 上传文件 > 粘贴文本。
        let rows = [];
        if (input.rows && input.rows.length > 0) {
            rows = input.rows;
        }
        else if (input.fileBase64) {
            rows = this.parseTableFile(input.fileBase64, input.filename ?? 'upload.csv');
        }
        else if (input.csv) {
            rows = parseCsv(input.csv);
        }
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
    /** 当前生效的识图通道：设置优先，其次与抽取模型一致。 */
    resolveVision(settings) {
        if (settings.visionProvider && settings.visionModel) {
            return { provider: settings.visionProvider, model: settings.visionModel };
        }
        return this.resolveModel(settings);
    }
    /**
     * 图片预览：读取图片并返回结构化草稿，不写库。
     *
     * 双通道：先用识图通道把图中内容读成文本，再交给文本抽取模型做结构化；
     * 识图通道与文本模型是同一个模型时，仍然走同一条「先读后抽」的路径，
     * 这样模型不支持一次调用同时识图与出 JSON 也不会中断。
     */
    async previewImage(input) {
        const settings = await this.settings();
        const date = input.date ?? localDay();
        if (!this.host.streamText || !this.host.saveImage) {
            throw new Error('当前宿主没有可用的识图能力（缺少附件或模型服务）。');
        }
        const vision = this.resolveVision(settings);
        if (!vision)
            throw new Error('还没有指定识图模型：请在设置里配置模型或识图通道。');
        const attachment = await this.host.saveImage(input.base64, input.mediaType, input.name ?? 'checkin-image');
        const note = String(input.note ?? '').slice(0, MAX_TEXT);
        // 第一步：识图通道把图片读成文字。
        let imageText = '';
        try {
            const rawImageText = await this.callStream({
                provider: vision.provider,
                model: vision.model,
                text: note
                    || '直接读出图片里的健康数值：体重、蛋白质、训练内容与时长、睡眠、心率、步数等。'
                        + '用简体中文分条写，每行一个数值。不要调用任何工具，不要输出标签或 JSON。',
                image: attachment,
            });
            imageText = cleanModelText(rawImageText);
        }
        catch (error) {
            throw new Error(`识图失败：${error instanceof Error ? error.message : String(error)}`);
        }
        if (!imageText.trim())
            throw new Error('识图通道没有返回内容，请换一张更清晰的图片。');
        // 第二步：文本抽取模型把文字读成结构化字段。
        const extraction = this.resolveModel(settings);
        let draft = null;
        let warning = '';
        if (extraction) {
            try {
                const raw = await this.callStream({
                    provider: extraction.provider,
                    model: extraction.model,
                    text: `打卡日期: ${date}\n图片里读到的内容:\n${imageText}\n\n补充说明: ${note}`,
                });
                draft = normalizeModelOutput(this.parseModelJson(raw), imageText, date);
            }
            catch (error) {
                warning = `结构化抽取失败，已保留识图原文：${error instanceof Error ? error.message : String(error)}`;
            }
        }
        if (!draft) {
            draft = attachKnownFlags({
                date,
                raw_text: imageText,
                red_flags: [],
                body_required: {},
                psych_required: {},
                optional: {},
            });
            warning = warning || '没有可用的文本抽取模型，只保留了识图原文，请手动补字段。';
        }
        return { draft, source: 'image', visionModel: `${vision.provider}/${vision.model}`, warning };
    }
    /** 图片写入：把预览确认后的草稿落库。 */
    async commitSession(session, source = 'image_ocr') {
        const merged = await this.store.mergeAndSaveSession(session, source);
        return merged;
    }
    /**
     * 图片导入（一步到位版，供工具与旧调用方使用）。
     *
     * 没配模型或没视觉能力时不猜——直接抛错说明缺什么，避免把「未识别」当「没摄入」。
     */
    async submitImage(input) {
        const preview = await this.previewImage(input);
        const merged = await this.commitSession(preview.draft, 'image_ocr');
        return { session: merged, source: 'image', warning: preview.warning };
    }
    /**
     * 写选填项。
     *
     * 只合并 `optional` 字段，不碰必填与红旗；键必须是 58 项之一，
     * 值支持 1–5、`{ hours }`、或 null（显式清除）。
     */
    async submitOptional(input) {
        const clean = {};
        for (const [key, value] of Object.entries(input.items ?? {})) {
            if (!OPTIONAL_INDEX.has(key))
                continue;
            clean[key] = value;
        }
        if (Object.keys(clean).length === 0)
            throw new Error('没有可写入的选填项。');
        const existing = (await this.store.readSession(input.date)) ?? {
            date: input.date,
            body_required: {},
            psych_required: {},
            optional: {},
        };
        const mergedOptional = { ...(existing.optional ?? {}) };
        for (const [key, value] of Object.entries(clean)) {
            if (value === null || value === undefined)
                delete mergedOptional[key];
            else
                mergedOptional[key] = value;
        }
        // 整条覆盖写：合并写会跳过 null，清除项就落不了盘。
        const next = {
            ...existing,
            date: input.date,
            optional: mergedOptional,
            sources: Array.from(new Set([...(existing.sources ?? []), 'self_report'])),
        };
        return this.store.writeSession(input.date, next);
    }
    /** 读某一天的完整记录（含 optional）。 */
    async readDay(date) {
        return this.store.readSession(date);
    }
    /** 删除某一天的记录。 */
    async deleteDay(date) {
        return this.store.deleteSession(date);
    }
    /** 红旗专用：只记日期与红旗，不写训练与营养（上游 06-red-flag 要求）。 */
    async submitFlagOnly(input) {
        const flags = (input.flags ?? []).map((flag) => String(flag).trim()).filter(Boolean);
        if (flags.length === 0)
            throw new Error('没有给出红旗词。');
        return this.store.mergeAndSaveSession({ date: input.date, red_flags: flags }, 'self_report');
    }
    /** 读自定义计分标准。 */
    async targets() {
        const profile = await this.store.loadProfile();
        const targets = profile.targets ?? {};
        const perKg = targets.protein_g_per_kg !== undefined ? Number(targets.protein_g_per_kg) : 1.6;
        const per7d = targets.resistance_sessions_per_7d !== undefined ? Number(targets.resistance_sessions_per_7d) : 3;
        const weight = profile.weight_kg !== undefined ? Number(profile.weight_kg) : null;
        return {
            protein_g_per_kg: perKg,
            resistance_sessions_per_7d: per7d,
            source: String(targets.protein_source ?? 'literature_default_1.6_within_1.4_2.0'),
            targetProteinG: weight === null || Number.isNaN(weight) ? null : Math.round(weight * perKg),
        };
    }
    /**
     * 写自定义计分标准。
     *
     * 超出文献范围（蛋白 1.4–2.0 克/公斤、抗阻 ≥2 次/周）时**不拒绝保存**，
     * 但写一行 `settings/log.jsonl` 审计，与上游 `custom-standard.md` 一致。
     */
    async saveTargets(input) {
        const perKg = Number(input.protein_g_per_kg);
        const per7d = Number(input.resistance_sessions_per_7d);
        if (!Number.isFinite(perKg) || perKg <= 0)
            throw new Error('蛋白质系数必须是正数。');
        if (!Number.isFinite(per7d) || per7d <= 0)
            throw new Error('每周抗阻次数必须是正数。');
        const proteinOut = perKg < 1.4 || perKg > 2.0;
        const resistanceOut = per7d < 2;
        const outOfRange = proteinOut || resistanceOut;
        const range = '文献范围：蛋白质 1.4–2.0 克/公斤（ISSN 2017）；抗阻至少每周 2 次（ACSM 2026）';
        if (outOfRange && input.confirm !== true) {
            return { saved: false, outOfRange: true, range, log: null };
        }
        const profile = await this.store.loadProfile();
        const before = await this.targets();
        const next = {
            ...profile,
            targets: {
                ...(profile.targets ?? {}),
                protein_g_per_kg: perKg,
                resistance_sessions_per_7d: per7d,
                protein_source: outOfRange ? 'user_outside_literature' : 'user_within_literature',
            },
        };
        await this.store.saveProfile(next);
        const entry = {
            at: new Date().toISOString(),
            field: 'targets',
            from: { protein_g_per_kg: before.protein_g_per_kg, resistance_sessions_per_7d: before.resistance_sessions_per_7d },
            to: { protein_g_per_kg: perKg, resistance_sessions_per_7d: per7d },
            source: outOfRange ? 'user_outside_literature' : 'user_within_literature',
            sentence: outOfRange ? '超出文献范围，按用户自定义计分' : '在文献范围内，按用户自定义计分',
        };
        await this.store.appendStandardLog(entry);
        return { saved: true, outOfRange, range, log: entry };
    }
    /** 读评估快照列表与自定义标准日志。 */
    async analyses() {
        return { files: await this.store.listAnalyses() };
    }
    /** 读一份快照。 */
    async readAnalysis(name) {
        return this.store.readAnalysis(name);
    }
    /** 读自定义标准审计日志。 */
    async standardLog() {
        return this.store.readStandardLog();
    }
    /** 导出原始记录与当前评分。 */
    async exportAll(format) {
        const [profile, sessions] = await Promise.all([this.store.loadProfile(), this.store.loadSessions()]);
        const score = scorePayload({ profile, sessions });
        const stamp = localDay();
        if (format === 'csv') {
            const header = ['date', 'protein_g', 'resistance_minutes', 'resistance_done', 'progressive_overload', 'self_rating', 'classification', 'optional_keys'];
            const lines = [header.join(',')];
            for (const session of sessions) {
                const body = (session.body_required ?? {});
                const psych = (session.psych_required ?? {});
                const optional = (session.optional ?? {});
                const cell = (value) => {
                    if (value === null || value === undefined)
                        return '';
                    const text = String(value);
                    return text.includes(',') || text.includes('"') ? `"${text.replace(/"/g, '""')}"` : text;
                };
                lines.push([
                    cell(session.date),
                    cell(body.protein_g),
                    cell(body.resistance_minutes),
                    cell(body.resistance_done),
                    cell(body.progressive_overload ?? body.overload),
                    cell(psych.self_rating_1_to_5 ?? psych.execution_likert),
                    cell(psych.classification ?? psych.feedback_category),
                    cell(Object.keys(optional).join('|')),
                ].join(','));
            }
            return { body: `${lines.join('\n')}\n`, contentType: 'text/csv; charset=utf-8', filename: `health-${stamp}.csv` };
        }
        return {
            body: JSON.stringify({ profile, sessions, score }, null, 2),
            contentType: 'application/json; charset=utf-8',
            filename: `health-${stamp}.json`,
        };
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
