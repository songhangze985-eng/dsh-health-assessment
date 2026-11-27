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
/** 档案六项必填；缺任何一项即 `blocked_profile`。 */
export const REQUIRED_PROFILE = [
    'height_cm',
    'weight_kg',
    'age',
    'sex',
    'training_years',
    'injury',
];
/** 红旗词：命中即停分。 */
export const RED_FLAGS = ['胸痛', '昏厥', '自伤', '自行停药', '急性剧痛'];
/** 扩展红旗词。 */
export const EXTENDED_RED_FLAGS = [
    '呼吸困难',
    '异常心悸',
    '晕厥',
    '轻生',
    '骨裂',
    '关节急性肿胀',
];
/** 全部红旗词。 */
export const ALL_RED_FLAGS = [...RED_FLAGS, ...EXTENDED_RED_FLAGS];
/** 否定词：紧邻红旗词时不算命中。 */
export const NEGATION_MARKS = ['没有', '无', '否认', '未出现', '未诉'];
/** 会被扫描红旗的文本字段。 */
export const TEXT_FIELDS = ['raw_text', 'text', 'note'];
/** 算作「处理得好」的评价分类。 */
export const VALID_CLASSIFICATION = new Set(['kept_and_changed', 'discarded_insult']);
/** 英文别名 → 中文规范名。 */
export const OPTIONAL_ALIASES = {
    sleep_quality: '睡眠时长',
    anti_inflammatory_diet: '饮食质量',
    hydration: '总饮水量',
    cardio_activity: '日常步数',
    load_recovery: '恢复干预',
    vital_signs: '基础机能',
    emotional_stability: '情绪波动',
    stress_relief: '日常压力',
    focus_state: '注意力',
    self_care: '自我照顾',
};
/** 缺项的中文标签 → 结构化字段提示。 */
export const GAP_LABELS = {
    蛋白质: 'protein_g (今日蛋白质摄入克数)',
    抗阻: 'resistance_done (今日抗阻训练情况)',
    超负荷: 'progressive_overload (是否实现渐进超负荷)',
    黄毛自评分: 'self_rating_1_to_5 (今日执行力/心理状态 1-5 自评)',
    评价分类: 'feedback_category (外界评价处理分类)',
};
const BODY_SHARE = 80 / 3;
const PSYCH_PART = 40;
const OPTIONAL_POOL = 20;
/** 身体侧选填名单（顺序即输出顺序）。 */
export const BODY_OPTIONAL = [
    '睡眠时长', '作息节律', '睡眠深度', '睡前行为', '结构均衡', '三餐规律', '饮食质量',
    '进食习惯', '总饮水量', '饮水节奏', '饮品结构', '有氧运动', '户外日照', '柔韧拉伸',
    '运动过载', '疾病伤痛', '生理透支', '恢复干预', '久坐时长', '日常步数', '体态习惯',
    '动作模式', '体重/BMI', '排便规律', '基础机能', '小症状频次', '口腔卫生', '用眼卫生',
    '个人卫生', '健康管理',
];
/** 心理侧选填名单。 */
export const PSYCH_OPTIONAL = [
    '情绪波动', '负面情绪持续', '情绪表达', '情绪底色', '日常压力', '躯体化表现', '耗竭感',
    '压力叠加', '挫折应对', '心态弹性', '归因方式', '恢复速度', '人际互动', '支持系统',
    '关系质量', '归属感', '日常满意度', '目标感', '自我接纳', '掌控感', '注意力',
    '记忆力', '思维清晰度', '杂念水平', '放松时间', '自我照顾', '兴趣滋养', '边界感',
];
/** 非数字值的宽松数值化，等价于 Python `float(x)` 在常见输入上的行为。 */
function num(value) {
    if (typeof value === 'number')
        return value;
    if (typeof value === 'boolean')
        return value ? 1 : 0;
    if (typeof value === 'string' && value.trim() !== '')
        return Number(value);
    return Number.NaN;
}
/** 严格数值：只有 number（非 bool）才认，对齐 Python 的 `isinstance(v, (int, float))`。 */
function isNumber(value) {
    return typeof value === 'number' && !Number.isNaN(value);
}
/** 真值判断，对齐 Python 的 `dict.get(...) is not None`。 */
function isPresent(value) {
    return value !== null && value !== undefined;
}
/** Python `str.strip()` 的近似（去空白）。 */
function strip(value) {
    return String(value).trim();
}
/**
 * Python `round(x, 2)`：按二进制精确值做十进制舍入，半值取偶。
 *
 * 不能用 `toFixed`：它对 0.625 给 0.63，而 CPython 给 0.62。
 * 这里把 double 拆成 `m × 2^e` 的精确有理数，再用 BigInt 做一次除法比较，
 * 半值判断与 Python 完全一致。
 */
export function r2(value) {
    if (!Number.isFinite(value) || value === 0)
        return value;
    const negative = value < 0;
    const abs = Math.abs(value);
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, abs);
    const high = view.getUint32(0);
    const low = view.getUint32(4);
    const exponentBits = (high >>> 20) & 0x7ff;
    let mantissa = (BigInt(high & 0xf_ffff) << 32n) | BigInt(low);
    let exponent;
    if (exponentBits === 0) {
        exponent = -1074;
    }
    else {
        mantissa |= 1n << 52n;
        exponent = exponentBits - 1075;
    }
    let numerator = mantissa;
    let denominator = 1n;
    if (exponent >= 0)
        numerator <<= BigInt(exponent);
    else
        denominator <<= BigInt(-exponent);
    const scale = 100n;
    const scaled = numerator * scale;
    const quotient = scaled / denominator;
    const remainder = scaled % denominator;
    const doubled = remainder * 2n;
    const rounded = doubled > denominator || (doubled === denominator && quotient % 2n === 1n)
        ? quotient + 1n
        : quotient;
    const result = Number(rounded) / 100;
    return negative ? -result : result;
}
/** Python `str(float)`：整数补 `.0`，保证结论文本与上游逐字一致。 */
export function reprFloat(value) {
    if (!Number.isFinite(value)) {
        if (Number.isNaN(value))
            return 'nan';
        return value > 0 ? 'inf' : '-inf';
    }
    if (Number.isInteger(value))
        return Object.is(value, -0) ? '-0.0' : `${String(value)}.0`;
    return String(value);
}
/**
 * 解析 `YYYY-MM-DD` 为 UTC 日序号。
 *
 * 用日序号而不用 Date 对象，是为了让「相隔几天」不受本地时区与夏令时影响。
 * 非法日期直接抛错，与 Python `strptime` 一致。
 */
export function parseDay(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match)
        throw new Error(`Invalid date: ${value}`);
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const ms = Date.UTC(year, month - 1, day);
    const check = new Date(ms);
    if (check.getUTCFullYear() !== year
        || check.getUTCMonth() !== month - 1
        || check.getUTCDate() !== day) {
        throw new Error(`Invalid date: ${value}`);
    }
    return Math.floor(ms / 86_400_000);
}
/** 1–5 自评转比例；越界或非数字返回 null。 */
export function likertRatio(value) {
    if (typeof value === 'boolean' || !isNumber(value))
        return null;
    if (value < 1 || value > 5)
        return null;
    return value / 5;
}
/** 蛋白质目标克数与来源。 */
export function proteinTarget(profile) {
    const weight = num(profile.weight_kg);
    const targets = profile.targets || {};
    const gramsPerKg = isPresent(targets.protein_g_per_kg) ? num(targets.protein_g_per_kg) : 1.6;
    const source = isPresent(targets.protein_source)
        ? String(targets.protein_source)
        : 'literature_default_1.6_within_1.4_2.0';
    return [weight * gramsPerKg, source];
}
/** 每周抗阻目标次数。 */
export function resistancePer7d(profile) {
    const targets = profile.targets || {};
    return isPresent(targets.resistance_sessions_per_7d) ? num(targets.resistance_sessions_per_7d) : 3;
}
/** 单条记录换算蛋白质完成比例。 */
export function sessionProteinRatio(session, targetG) {
    const body = session.body_required || {};
    if (isPresent(body.protein_g)) {
        const grams = num(body.protein_g);
        const ratio = targetG <= 0 ? 1 : Math.min(1, grams / targetG);
        return [ratio, 'number'];
    }
    if (isPresent(body.protein_ratio)) {
        return [Math.min(1, Math.max(0, num(body.protein_ratio))), 'ratio'];
    }
    const ratio = likertRatio(body.protein_likert);
    if (ratio === null)
        return [null, 'missing'];
    return [ratio, 'likert'];
}
/** 单条记录是否算一次抗阻。 */
export function sessionHasResistance(session) {
    const body = session.body_required || {};
    const sets = body.resistance_sets;
    const load = body.resistance_load_kg;
    if (isPresent(sets) && isPresent(load))
        return [true, 'number'];
    if (likertRatio(body.resistance_likert) !== null)
        return [true, 'likert'];
    if (body.resistance_done === true)
        return [true, 'done'];
    const minutes = body.resistance_minutes;
    if (isNumber(minutes) && minutes > 0)
        return [true, 'minutes'];
    return [false, 'missing'];
}
/** 单条记录的超负荷观察值。 */
export function overloadValue(body) {
    if (typeof body.overload === 'boolean')
        return body.overload ? 1 : 0;
    if (typeof body.progressive_overload === 'boolean')
        return body.progressive_overload ? 1 : 0;
    if (isNumber(body.progressive_overload)) {
        return Math.min(1, Math.max(0, body.progressive_overload));
    }
    const likert = likertRatio(body.overload_likert);
    if (likert !== null)
        return likert;
    return null;
}
/** 全窗超负荷观察序列（含「与上次重量比较」的推导）。 */
export function overloadObservations(sessions) {
    const ratios = [];
    let previousLoad = null;
    for (const session of sessions) {
        const body = session.body_required || {};
        const observed = overloadValue(body);
        if (observed !== null) {
            ratios.push(observed);
        }
        else if (isPresent(body.resistance_load_kg) && previousLoad !== null) {
            const current = num(body.resistance_load_kg);
            ratios.push(current > previousLoad ? 1 : 0);
        }
        if (isPresent(body.resistance_load_kg)) {
            previousLoad = num(body.resistance_load_kg);
        }
    }
    return ratios;
}
/** 选填项比例。 */
export function optionalRatio(key, raw) {
    if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
        const record = raw;
        if (isPresent(record.likert))
            return likertRatio(record.likert);
        if (isPresent(record.actual) && record.target !== null && record.target !== undefined && record.target !== 0) {
            return Math.min(1, num(record.actual) / num(record.target));
        }
        if (key === '睡眠时长' && isPresent(record.hours)) {
            const hours = num(record.hours);
            return hours >= 7 ? 1 : Math.max(0, hours / 7);
        }
        return null;
    }
    if (key === '睡眠时长' && isNumber(raw) && raw > 5) {
        const hours = raw;
        return hours >= 7 ? 1 : Math.max(0, hours / 7);
    }
    return likertRatio(raw);
}
/** 平均值；空数组返回 null。 */
export function mean(values) {
    if (values.length === 0)
        return null;
    let total = 0;
    for (const value of values)
        total += value;
    return total / values.length;
}
/** 缺失的建档字段。 */
export function missingProfile(profile) {
    const missing = [];
    for (const key of REQUIRED_PROFILE) {
        const value = profile[key];
        if (!isPresent(value) || value === '')
            missing.push(key);
    }
    return missing;
}
/** 日期是否落在窗口内。 */
export function inWindow(day, window) {
    if (!window)
        return true;
    if (window.start && day < parseDay(window.start))
        return false;
    if (window.end && day > parseDay(window.end))
        return false;
    return true;
}
/** 关键词是否被肯定断言（紧邻否定词则视为否认）。 */
export function keywordIsAsserted(text, keyword) {
    let start = 0;
    for (;;) {
        const index = text.indexOf(keyword, start);
        if (index < 0)
            return false;
        const prefix = text.slice(Math.max(0, index - 3), index);
        if (NEGATION_MARKS.some((mark) => prefix.endsWith(mark))) {
            start = index + keyword.length;
            continue;
        }
        return true;
    }
}
/** 红旗明细（显式标签 + 文本扫描，去重按「日期 + 词」）。 */
export function collectRedFlagDetails(sessions) {
    const found = [];
    const seen = new Set();
    for (const session of sessions) {
        const day = isPresent(session.date) ? String(session.date) : 'unknown';
        for (const flag of session.red_flags || []) {
            const flagText = strip(flag);
            if (ALL_RED_FLAGS.includes(flagText) && !seen.has(`${day}\u0000${flagText}`)) {
                seen.add(`${day}\u0000${flagText}`);
                found.push({ date: day, flag: flagText, source: 'explicit' });
            }
        }
        const blobs = TEXT_FIELDS.map((field) => String(session[field] ?? ''));
        const combined = blobs.filter((part) => part.trim() !== '').join(' ');
        if (combined.trim() === '')
            continue;
        for (const keyword of ALL_RED_FLAGS) {
            if (keywordIsAsserted(combined, keyword) && !seen.has(`${day}\u0000${keyword}`)) {
                seen.add(`${day}\u0000${keyword}`);
                found.push({ date: day, flag: keyword, source: 'text_scan' });
            }
        }
    }
    return found;
}
/** 去重后的红旗词。 */
export function collectRedFlags(sessions) {
    const flags = [];
    for (const item of collectRedFlagDetails(sessions)) {
        if (!flags.includes(item.flag))
            flags.push(item.flag);
    }
    return flags;
}
/** 不同日期数与自然日跨度（窗口可撑大跨度）。 */
export function computeCalendarSpan(sessions, window) {
    const parsed = [];
    const rawDays = new Set();
    for (const item of sessions) {
        const raw = strip(item.date ?? '').slice(0, 10);
        if (raw === '')
            continue;
        rawDays.add(raw);
        parsed.push(parseDay(raw));
    }
    const distinct = rawDays.size;
    if (parsed.length === 0)
        return [distinct, Math.max(distinct, 1)];
    let earliest = Math.min(...parsed);
    let latest = Math.max(...parsed);
    if (window) {
        if (window.start) {
            const windowStart = parseDay(String(window.start).slice(0, 10));
            if (windowStart < earliest)
                earliest = windowStart;
        }
        if (window.end) {
            const windowEnd = parseDay(String(window.end).slice(0, 10));
            if (windowEnd > latest)
                latest = windowEnd;
        }
    }
    const span = Math.max(latest - earliest + 1, distinct, 1);
    return [distinct, span];
}
/** 英文别名的 0–1 数字按语义转成比例或小时。 */
export function aliasOptionalValue(canonical, raw) {
    if (typeof raw === 'boolean' || !isNumber(raw))
        return raw;
    if (canonical === '睡眠时长' && raw >= 0 && raw <= 1)
        return { hours: raw * 7 };
    if (raw >= 0 && raw <= 1)
        return { actual: raw, target: 1 };
    return raw;
}
/** 记录规范化：日期切片、别名补齐、超负荷与自评分口径统一。 */
export function normalizeSession(session) {
    const item = { ...session };
    if (item.date)
        item.date = strip(item.date).slice(0, 10);
    const body = { ...(item.body_required || {}) };
    if (!Object.hasOwn(body, 'overload') && Object.hasOwn(body, 'progressive_overload')) {
        body.overload = body.progressive_overload;
    }
    item.body_required = body;
    const psych = { ...(item.psych_required || {}) };
    if (!isPresent(psych.execution_likert)) {
        if (isPresent(psych.self_rating_1_to_5))
            psych.execution_likert = psych.self_rating_1_to_5;
        else if (isPresent(psych.likert))
            psych.execution_likert = psych.likert;
    }
    if (!psych.classification && psych.feedback_category)
        psych.classification = psych.feedback_category;
    item.psych_required = psych;
    const optional = { ...(item.optional || {}) };
    for (const [alias, canonical] of Object.entries(OPTIONAL_ALIASES)) {
        if (!Object.hasOwn(optional, alias) || optional[alias] === null || optional[alias] === undefined)
            continue;
        if (optional[canonical] === null || optional[canonical] === undefined) {
            optional[canonical] = aliasOptionalValue(canonical, optional[alias]);
        }
    }
    item.optional = optional;
    return item;
}
/** 自评分比例（三种字段名任取其一）。 */
export function executionRatio(psych) {
    for (const key of ['execution_likert', 'self_rating_1_to_5', 'likert']) {
        const ratio = likertRatio(psych[key]);
        if (ratio !== null)
            return ratio;
    }
    return null;
}
/** 某天的缺项与完成度。 */
export function inspectDailyGaps(sessions, targetDate) {
    const normalized = sessions.map(normalizeSession);
    let day = targetDate;
    if (!day) {
        const dated = normalized.filter((item) => item.date).map((item) => String(item.date));
        day = dated.length > 0 ? dated.reduce((a, b) => (a > b ? a : b)) : '';
    }
    const daySessions = normalized.filter((item) => item.date === day);
    const gaps = requiredGaps(daySessions, 1);
    const recorded = [];
    for (const item of daySessions) {
        for (const [key, value] of Object.entries(item.optional || {})) {
            if (value !== null && value !== undefined && !Object.hasOwn(OPTIONAL_ALIASES, key) && !recorded.includes(key)) {
                recorded.push(key);
            }
        }
    }
    return {
        target_date: day,
        required_completion_ratio: r2((5 - gaps.length) / 5),
        missing_required_fields: gaps.map((gap) => GAP_LABELS[gap]),
        recorded_optional_fields: recorded,
    };
}
/**
 * 某一天的必填清单。
 *
 * 界面只认这里的 label，不认 `protein_g` 之类的字段名；`hint` 是「怎么补」的一句话。
 */
export function dailyChecklist(sessions, targetDate) {
    const day = sessions.map(normalizeSession).filter((item) => item.date === targetDate);
    const hasProtein = day.some((item) => sessionProteinRatio(item, 1)[0] !== null);
    const hasResistance = day.some((item) => sessionHasResistance(item)[0]);
    const hasOverload = overloadObservations(day).length > 0;
    const hasRating = day.some((item) => executionRatio(item.psych_required || {}) !== null);
    const hasFeedback = day.some((item) => {
        const psych = item.psych_required || {};
        return Boolean(psych.classification || psych.feedback_category);
    });
    // 已完成的项取当天第一条命中的实际值，让界面显示「140g」而不是「已记录」。
    const proteinValue = (() => {
        for (const item of day) {
            const body = item.body_required || {};
            if (body.protein_g !== null && body.protein_g !== undefined)
                return `${Math.round(Number(body.protein_g))}g`;
            const likert = likertRatio(body.protein_likert);
            if (likert !== null)
                return `${Math.round(likert * 5)}/5`;
        }
        return '';
    })();
    const resistanceValue = (() => {
        for (const item of day) {
            const body = item.body_required || {};
            if (body.resistance_minutes !== null && body.resistance_minutes !== undefined) {
                return `${Math.round(Number(body.resistance_minutes))} 分钟`;
            }
            if (body.resistance_sets !== null && body.resistance_sets !== undefined)
                return `${String(body.resistance_sets)} 组`;
            if (body.resistance_done === true)
                return '已完成';
        }
        return '';
    })();
    const overloadValue_ = (() => {
        for (const item of day) {
            const observed = overloadValue(item.body_required || {});
            if (observed !== null)
                return observed >= 1 ? '已加重' : '未加重';
        }
        return '';
    })();
    const ratingValue = (() => {
        for (const item of day) {
            const ratio = executionRatio(item.psych_required || {});
            if (ratio !== null)
                return `${Math.round(ratio * 5)} 分`;
        }
        return '';
    })();
    const feedbackValue = (() => {
        for (const item of day) {
            const psych = item.psych_required || {};
            const label = String(psych.classification || psych.feedback_category || '');
            if (label === 'kept_and_changed')
                return '采纳并改进';
            if (label === 'discarded_insult')
                return '丢弃攻击';
            if (label === 'invalid')
                return '内耗';
        }
        return '';
    })();
    return [
        { key: 'protein', label: '蛋白质摄入', hint: '写克数，例如「蛋白质 120g」', done: hasProtein, value: proteinValue },
        { key: 'resistance', label: '抗阻训练', hint: '写训练内容或分钟数，例如「抗阻 45 分钟」', done: hasResistance, value: resistanceValue },
        { key: 'overload', label: '渐进超负荷', hint: '写是否加重量或多做一组，例如「加重了卧推」', done: hasOverload, value: overloadValue_ },
        { key: 'rating', label: '执行力与心态自评', hint: '1–5 分，例如「状态 4 分」', done: hasRating, value: ratingValue },
        { key: 'feedback', label: '外界评价处理', hint: '可测量就采纳，人身攻击就丢弃，例如「听取建议」', done: hasFeedback, value: feedbackValue },
    ];
}
/** 必填五项里缺哪些。 */
export function requiredGaps(sessions, targetG) {
    const gaps = [];
    if (!sessions.some((item) => sessionProteinRatio(item, targetG)[0] !== null))
        gaps.push('蛋白质');
    if (!sessions.some((item) => sessionHasResistance(item)[0]))
        gaps.push('抗阻');
    if (overloadObservations(sessions).length === 0)
        gaps.push('超负荷');
    if (!sessions.some((item) => executionRatio(item.psych_required || {}) !== null))
        gaps.push('黄毛自评分');
    if (!sessions.some((item) => {
        const psych = item.psych_required || {};
        return Boolean(psych.classification || psych.feedback_category);
    })) {
        gaps.push('评价分类');
    }
    return gaps;
}
/** 选填评分：写过的小项之间平分 20 分。 */
export function scoreOptional(sessions, keys) {
    const grouped = new Map();
    for (const session of sessions) {
        const optional = session.optional || {};
        for (const key of keys) {
            if (!Object.hasOwn(optional, key))
                continue;
            const ratio = optionalRatio(key, optional[key]);
            if (ratio === null)
                continue;
            const bucket = grouped.get(key);
            if (bucket)
                bucket.push(ratio);
            else
                grouped.set(key, [ratio]);
        }
    }
    if (grouped.size === 0)
        return { status: '无法评分', score: null, items: [] };
    const share = OPTIONAL_POOL / grouped.size;
    const items = [];
    let total = 0;
    for (const key of keys) {
        const bucket = grouped.get(key);
        if (!bucket)
            continue;
        const ratio = mean(bucket) ?? 0;
        const points = ratio * share;
        total += points;
        items.push({ item: key, mean_ratio: r2(ratio), points: r2(points) });
    }
    return { status: 'scored', score: r2(total), items };
}
/** 身体必填 80 分。 */
export function scoreBodyRequired(sessions, profile, calendarSpanDays) {
    const [targetG, source] = proteinTarget(profile);
    const protein = sessions
        .map((item) => sessionProteinRatio(item, targetG)[0])
        .filter((item) => item !== null);
    const resistanceDays = sessions.filter((item) => sessionHasResistance(item)[0]).length;
    const span = calendarSpanDays ?? computeCalendarSpan(sessions)[1];
    const expected = resistancePer7d(profile) * (span / 7);
    const overload = overloadObservations(sessions);
    const parts = {
        蛋白质: protein.length === 0 ? null : mean(protein),
        抗阻: resistanceDays === 0 || expected <= 0 ? null : Math.min(1, resistanceDays / expected),
        超负荷: overload.length === 0 ? null : mean(overload),
    };
    if (Object.values(parts).some((value) => value === null)) {
        return {
            status: '无法评分',
            score: null,
            target_protein_g: r2(targetG),
            protein_source: source,
            parts: Object.fromEntries(Object.entries(parts).map(([key, value]) => [key, value === null ? null : r2(value)])),
        };
    }
    const rawPoints = {};
    for (const [key, value] of Object.entries(parts))
        rawPoints[key] = (value ?? 0) * BODY_SHARE;
    return {
        status: 'scored',
        score: r2(Object.values(rawPoints).reduce((a, b) => a + b, 0)),
        target_protein_g: r2(targetG),
        protein_source: source,
        parts: Object.fromEntries(Object.entries(parts).map(([key, value]) => [key, r2(value ?? 0)])),
        points: Object.fromEntries(Object.entries(rawPoints).map(([key, value]) => [key, r2(value)])),
    };
}
/** 心理必填 80 分。 */
export function scorePsychRequired(sessions) {
    const ratings = [];
    const classes = [];
    for (const session of sessions) {
        const psych = session.psych_required || {};
        const ratio = executionRatio(psych);
        if (ratio !== null)
            ratings.push(ratio);
        const label = psych.classification || psych.feedback_category;
        if (label && VALID_CLASSIFICATION.has(String(label)))
            classes.push(1);
        else if (label === 'invalid')
            classes.push(0);
    }
    if (ratings.length === 0 || classes.length === 0) {
        return { status: '无法评分', score: null, execution: null, classification: null };
    }
    const execution = mean(ratings) ?? 0;
    const classification = mean(classes) ?? 0;
    const points = {
        自评分: r2(execution * PSYCH_PART),
        评价分类: r2(classification * PSYCH_PART),
    };
    return {
        status: 'scored',
        score: r2(points.自评分 + points.评价分类),
        execution: r2(execution),
        classification: r2(classification),
        points,
    };
}
/** 必填与选填合成。 */
export function combine(required, optional) {
    if (required.status !== 'scored' || optional.status !== 'scored') {
        return { status: '不合成', score: null };
    }
    return { status: 'scored', score: r2((required.score ?? 0) + (optional.score ?? 0)) };
}
/** 最多三条下一步；不满 7 天最多两条且不含训练动作。 */
export function nextSteps(mode, gaps, body, psych) {
    if (mode === 'redflag')
        return ['先按红旗处理：就医或当地紧急帮助。本轮不打分，不给训练建议。'];
    if (mode === 'blocked_profile')
        return ['补齐建库字段后再记。缺的字段不能估算。'];
    const steps = [];
    if (mode === 'under7') {
        steps.push('继续记到满 7 个不同日期。');
        if (gaps.length > 0)
            steps.push(`补上缺的必填：${gaps.join('、')}。`);
        return steps.slice(0, 2);
    }
    if (gaps.length > 0)
        steps.push(`补上缺的必填：${gaps.join('、')}。`);
    if (body.status === 'scored' && psych.status === 'scored') {
        const proteinRatio = (body.parts || {})['蛋白质'];
        if (isNumber(proteinRatio) && proteinRatio < 1) {
            steps.push(`下一次把蛋白质记到克数，并对照本人目标 ${reprFloat(body.target_protein_g ?? 0)} 克。这是记录目标，不是处方。`);
        }
        else if ((psych.execution ?? 1) < 1) {
            steps.push('下一次打卡写明 1–5 自评分，并给评价分类一个结果。');
        }
        else {
            steps.push('保持必填三项和评价分类连续记录，满窗后再看选填。');
        }
    }
    return steps.slice(0, 3);
}
/** 结论文字：薄肌与黄毛只在文字里出现。 */
export function conclusion(body, psych) {
    const parts = body.parts || {};
    const protein = parts['蛋白质'];
    const resistance = parts['抗阻'];
    const overload = parts['超负荷'];
    const bomi = body.status !== 'scored'
        ? '薄肌：蛋白质、抗阻或超负荷还有缺口，这一窗不把身体必填合成。'
        : `薄肌：蛋白质完成 ${reprFloat(protein ?? 0)}，抗阻完成 ${reprFloat(resistance ?? 0)}，超负荷完成 ${reprFloat(overload ?? 0)}。`;
    const huangmao = psych.status !== 'scored'
        ? '黄毛：自评分或评价分类还有缺口，这一窗不把心理必填合成。'
        : `黄毛：自评分比例 ${reprFloat(psych.execution ?? 0)}，评价分类比例 ${reprFloat(psych.classification ?? 0)}。可测量的评价应留下并改行为；人身攻击应丢弃。`;
    return { 薄肌: bomi, 黄毛: huangmao };
}
/** 计分入口：输入 payload，输出与 Python 脚本逐字段一致的结果。 */
export function scorePayload(payload) {
    const profile = payload.profile || {};
    const missing = missingProfile(profile);
    if (missing.length > 0) {
        return {
            mode: 'blocked_profile',
            missing_profile: missing,
            scores: null,
            next_steps: nextSteps('blocked_profile', [], { status: '无法评分', score: null }, { status: '无法评分', score: null }),
        };
    }
    const window = payload.window;
    const sessions = [];
    for (const item of payload.sessions || []) {
        const normalized = normalizeSession(item);
        const day = parseDay(String(normalized.date));
        if (inWindow(day, window))
            sessions.push(normalized);
    }
    sessions.sort((a, b) => (String(a.date) < String(b.date) ? -1 : String(a.date) > String(b.date) ? 1 : 0));
    const flagDetails = collectRedFlagDetails(sessions);
    const flags = [];
    for (const item of flagDetails) {
        if (!flags.includes(item.flag))
            flags.push(item.flag);
    }
    const [targetG] = proteinTarget(profile);
    const gaps = requiredGaps(sessions, targetG);
    const dates = Array.from(new Set(sessions.map((item) => String(item.date)))).sort();
    const [distinctDates, calendarSpanDays] = computeCalendarSpan(sessions, window);
    if (flags.length > 0) {
        return {
            mode: 'redflag',
            red_flags: flags,
            red_flag_details: flagDetails,
            dates,
            distinct_dates: distinctDates,
            calendar_span_days: calendarSpanDays,
            scores: null,
            next_steps: nextSteps('redflag', gaps, { status: '无法评分', score: null }, { status: '无法评分', score: null }),
            note: '有伤病只作档案备注，不在这里停分。停分只来自红旗。',
        };
    }
    if (dates.length < 7) {
        return {
            mode: 'under7',
            distinct_dates: distinctDates,
            calendar_span_days: calendarSpanDays,
            dates,
            raw_sessions: sessions.map((item) => ({
                date: item.date,
                date_defaulted: Boolean(item.date_defaulted),
                body_required: item.body_required || {},
                psych_required: item.psych_required || {},
            })),
            required_gaps: gaps,
            daily_progress: inspectDailyGaps(sessions, dates.length > 0 ? dates[dates.length - 1] : null),
            scores: null,
            label: '未满 7 天，不可统计分析',
            next_steps: nextSteps('under7', gaps, { status: '无法评分', score: null }, { status: '无法评分', score: null }),
        };
    }
    const bodyRequired = scoreBodyRequired(sessions, profile, calendarSpanDays);
    const psychRequired = scorePsychRequired(sessions);
    const bodyOptional = scoreOptional(sessions, BODY_OPTIONAL);
    const psychOptional = scoreOptional(sessions, PSYCH_OPTIONAL);
    const bodyTotal = combine(bodyRequired, bodyOptional);
    const psychTotal = combine(psychRequired, psychOptional);
    const total = bodyTotal.status === 'scored' && psychTotal.status === 'scored'
        ? { status: 'scored', score: r2((bodyTotal.score ?? 0) + (psychTotal.score ?? 0)) }
        : { status: '不合成', score: null };
    const names = conclusion(bodyRequired, psychRequired);
    const gapKeys = [];
    if (bodyRequired.status !== 'scored') {
        for (const key of ['蛋白质', '抗阻', '超负荷']) {
            if ((bodyRequired.parts || {})[key] === null)
                gapKeys.push(key);
        }
    }
    if (psychRequired.status !== 'scored') {
        if (psychRequired.execution === null)
            gapKeys.push('黄毛自评分');
        if (psychRequired.classification === null)
            gapKeys.push('评价分类');
    }
    return {
        mode: 'scored',
        distinct_dates: distinctDates,
        calendar_span_days: calendarSpanDays,
        dates,
        scores: {
            body_required: bodyRequired,
            body_optional: bodyOptional,
            body: bodyTotal,
            psych_required: psychRequired,
            psych_optional: psychOptional,
            psych: psychTotal,
            total,
        },
        conclusion: names,
        next_steps: nextSteps('scored', gapKeys, bodyRequired, psychRequired),
        daily_progress: inspectDailyGaps(sessions, dates.length > 0 ? dates[dates.length - 1] : null),
        injury_note: profile.injury ? '档案写了有伤病，只作备注，本轮不因此停分。' : '',
    };
}
