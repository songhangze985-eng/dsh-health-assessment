/**
 * 确定性计分内核：`scripts/score_checkin.py` 的逐函数移植。
 *
 * 唯一权威是上游 Python 脚本；本文件只做等价实现，任何行为差异都算缺陷。
 * 因此这里保留了几处看起来「多余」的写法（Python 式四舍五入、bool 与 number 的
 * 严格区分、浮点文本化、UTC 日序号），它们都是为了与 Python 输出逐字节对齐。
 *
 * 内核零依赖、无 I/O，host 与浏览器两侧共用。
 *
 * @module dsh-health-assessment/src/core/score
 */
import type { BodyRequired, CombinedScore, DailyProgress, OptionalScore, ProfileRecord, PsychRequired, RedFlagDetail, RequiredScore, ScorePayload, ScoreResult, SessionRecord } from './types.js';
/** 档案六项必填；缺任何一项即 `blocked_profile`。 */
export declare const REQUIRED_PROFILE: readonly ["height_cm", "weight_kg", "age", "sex", "training_years", "injury"];
/** 红旗词：命中即停分。 */
export declare const RED_FLAGS: readonly ["胸痛", "昏厥", "自伤", "自行停药", "急性剧痛"];
/** 扩展红旗词。 */
export declare const EXTENDED_RED_FLAGS: readonly ["呼吸困难", "异常心悸", "晕厥", "轻生", "骨裂", "关节急性肿胀"];
/** 全部红旗词。 */
export declare const ALL_RED_FLAGS: ("胸痛" | "昏厥" | "自伤" | "自行停药" | "急性剧痛" | "呼吸困难" | "异常心悸" | "晕厥" | "轻生" | "骨裂" | "关节急性肿胀")[];
/** 否定词：紧邻红旗词时不算命中。 */
export declare const NEGATION_MARKS: readonly ["没有", "无", "否认", "未出现", "未诉"];
/** 会被扫描红旗的文本字段。 */
export declare const TEXT_FIELDS: readonly ["raw_text", "text", "note"];
/** 算作「处理得好」的评价分类。 */
export declare const VALID_CLASSIFICATION: Set<string>;
/** 英文别名 → 中文规范名。 */
export declare const OPTIONAL_ALIASES: Record<string, string>;
/** 缺项的中文标签 → 结构化字段提示。 */
export declare const GAP_LABELS: Record<string, string>;
/** 身体侧选填名单（顺序即输出顺序）。 */
export declare const BODY_OPTIONAL: readonly ["睡眠时长", "作息节律", "睡眠深度", "睡前行为", "结构均衡", "三餐规律", "饮食质量", "进食习惯", "总饮水量", "饮水节奏", "饮品结构", "有氧运动", "户外日照", "柔韧拉伸", "运动过载", "疾病伤痛", "生理透支", "恢复干预", "久坐时长", "日常步数", "体态习惯", "动作模式", "体重/BMI", "排便规律", "基础机能", "小症状频次", "口腔卫生", "用眼卫生", "个人卫生", "健康管理"];
/** 心理侧选填名单。 */
export declare const PSYCH_OPTIONAL: readonly ["情绪波动", "负面情绪持续", "情绪表达", "情绪底色", "日常压力", "躯体化表现", "耗竭感", "压力叠加", "挫折应对", "心态弹性", "归因方式", "恢复速度", "人际互动", "支持系统", "关系质量", "归属感", "日常满意度", "目标感", "自我接纳", "掌控感", "注意力", "记忆力", "思维清晰度", "杂念水平", "放松时间", "自我照顾", "兴趣滋养", "边界感"];
/**
 * Python `round(x, 2)`：按二进制精确值做十进制舍入，半值取偶。
 *
 * 不能用 `toFixed`：它对 0.625 给 0.63，而 CPython 给 0.62。
 * 这里把 double 拆成 `m × 2^e` 的精确有理数，再用 BigInt 做一次除法比较，
 * 半值判断与 Python 完全一致。
 */
export declare function r2(value: number): number;
/** Python `str(float)`：整数补 `.0`，保证结论文本与上游逐字一致。 */
export declare function reprFloat(value: number): string;
/**
 * 解析 `YYYY-MM-DD` 为 UTC 日序号。
 *
 * 用日序号而不用 Date 对象，是为了让「相隔几天」不受本地时区与夏令时影响。
 * 非法日期直接抛错，与 Python `strptime` 一致。
 */
export declare function parseDay(value: string): number;
/** 1–5 自评转比例；越界或非数字返回 null。 */
export declare function likertRatio(value: unknown): number | null;
/** 蛋白质目标克数与来源。 */
export declare function proteinTarget(profile: ProfileRecord): [number, string];
/** 每周抗阻目标次数。 */
export declare function resistancePer7d(profile: ProfileRecord): number;
/** 单条记录换算蛋白质完成比例。 */
export declare function sessionProteinRatio(session: SessionRecord, targetG: number): [number | null, 'number' | 'ratio' | 'likert' | 'missing'];
/** 单条记录是否算一次抗阻。 */
export declare function sessionHasResistance(session: SessionRecord): [boolean, 'number' | 'likert' | 'done' | 'minutes' | 'missing'];
/** 单条记录的超负荷观察值。 */
export declare function overloadValue(body: BodyRequired): number | null;
/** 全窗超负荷观察序列（含「与上次重量比较」的推导）。 */
export declare function overloadObservations(sessions: SessionRecord[]): number[];
/** 选填项比例。 */
export declare function optionalRatio(key: string, raw: unknown): number | null;
/** 平均值；空数组返回 null。 */
export declare function mean(values: number[]): number | null;
/** 缺失的建档字段。 */
export declare function missingProfile(profile: ProfileRecord): string[];
/** 日期是否落在窗口内。 */
export declare function inWindow(day: number, window: {
    start?: string;
    end?: string;
} | null | undefined): boolean;
/** 关键词是否被肯定断言（紧邻否定词则视为否认）。 */
export declare function keywordIsAsserted(text: string, keyword: string): boolean;
/** 红旗明细（显式标签 + 文本扫描，去重按「日期 + 词」）。 */
export declare function collectRedFlagDetails(sessions: SessionRecord[]): RedFlagDetail[];
/** 去重后的红旗词。 */
export declare function collectRedFlags(sessions: SessionRecord[]): string[];
/** 不同日期数与自然日跨度（窗口可撑大跨度）。 */
export declare function computeCalendarSpan(sessions: SessionRecord[], window?: {
    start?: string;
    end?: string;
} | null): [number, number];
/** 英文别名的 0–1 数字按语义转成比例或小时。 */
export declare function aliasOptionalValue(canonical: string, raw: unknown): unknown;
/** 记录规范化：日期切片、别名补齐、超负荷与自评分口径统一。 */
export declare function normalizeSession(session: SessionRecord): SessionRecord;
/** 自评分比例（三种字段名任取其一）。 */
export declare function executionRatio(psych: PsychRequired): number | null;
/** 某天的缺项与完成度。 */
export declare function inspectDailyGaps(sessions: SessionRecord[], targetDate?: string | null): DailyProgress;
/** 今日清单的一项：给界面用，只有中文标签与完成状态，不带内部字段名。 */
export interface ChecklistItem {
    key: string;
    label: string;
    hint: string;
    done: boolean;
    /** 已完成时展示实际值，例如「140g」「45 分钟」；未完成为空串。 */
    value: string;
}
/**
 * 某一天的必填清单。
 *
 * 界面只认这里的 label，不认 `protein_g` 之类的字段名；`hint` 是「怎么补」的一句话。
 */
export declare function dailyChecklist(sessions: SessionRecord[], targetDate: string): ChecklistItem[];
/** 必填五项里缺哪些。 */
export declare function requiredGaps(sessions: SessionRecord[], targetG: number): string[];
/** 选填评分：写过的小项之间平分 20 分。 */
export declare function scoreOptional(sessions: SessionRecord[], keys: readonly string[]): OptionalScore;
/** 身体必填 80 分。 */
export declare function scoreBodyRequired(sessions: SessionRecord[], profile: ProfileRecord, calendarSpanDays?: number | null): RequiredScore;
/** 心理必填 80 分。 */
export declare function scorePsychRequired(sessions: SessionRecord[]): RequiredScore;
/** 必填与选填合成。 */
export declare function combine(required: RequiredScore, optional: OptionalScore): CombinedScore;
/** 最多三条下一步；不满 7 天最多两条且不含训练动作。 */
export declare function nextSteps(mode: string, gaps: string[], body: RequiredScore, psych: RequiredScore): string[];
/** 结论文字：薄肌与黄毛只在文字里出现。 */
export declare function conclusion(body: RequiredScore, psych: RequiredScore): {
    薄肌: string;
    黄毛: string;
};
/** 计分入口：输入 payload，输出与 Python 脚本逐字段一致的结果。 */
export declare function scorePayload(payload: ScorePayload): ScoreResult;
