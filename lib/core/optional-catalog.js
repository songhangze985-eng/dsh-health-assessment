/**
 * 选填项目录：按 `standards/domains.md` 的 15 个维度分组，共 58 项。
 *
 * 键名必须与 `score.ts` 的 `BODY_OPTIONAL` / `PSYCH_OPTIONAL` 完全一致，
 * 因为计分器按这些中文字面量取分。这里只负责「怎么分组、怎么显示」，
 * 不复制计分逻辑，也不引入新的键。
 *
 * @module dsh-health-assessment/src/core/optional-catalog
 */
/** 睡眠时长按小时记；其余按 1–5。 */
const HOURS_KEY = '睡眠时长';
/** 身体侧 8 组 30 项。 */
const BODY_GROUPS = [
    { id: 'sleep', title: '睡眠质量', side: 'body', items: ['睡眠时长', '作息节律', '睡眠深度', '睡前行为'].map(toItem) },
    { id: 'diet', title: '膳食营养', side: 'body', items: ['结构均衡', '三餐规律', '饮食质量', '进食习惯'].map(toItem) },
    { id: 'water', title: '水分摄入', side: 'body', items: ['总饮水量', '饮水节奏', '饮品结构'].map(toItem) },
    { id: 'activity', title: '运动与身体活动', side: 'body', items: ['有氧运动', '户外日照', '柔韧拉伸'].map(toItem) },
    { id: 'load', title: '身体负荷与伤病', side: 'body', items: ['运动过载', '疾病伤痛', '生理透支', '恢复干预'].map(toItem) },
    { id: 'posture', title: '体态与日常活动', side: 'body', items: ['久坐时长', '日常步数', '体态习惯', '动作模式'].map(toItem) },
    { id: 'vitals', title: '基础健康体征', side: 'body', items: ['体重/BMI', '排便规律', '基础机能', '小症状频次'].map(toItem) },
    { id: 'hygiene', title: '健康防护与卫生', side: 'body', items: ['口腔卫生', '用眼卫生', '个人卫生', '健康管理'].map(toItem) },
];
/** 心理侧 7 组 28 项。 */
const PSYCH_GROUPS = [
    { id: 'emotion', title: '情绪稳定性', side: 'psych', items: ['情绪波动', '负面情绪持续', '情绪表达', '情绪底色'].map(toItem) },
    { id: 'stress', title: '压力与耗竭水平', side: 'psych', items: ['日常压力', '躯体化表现', '耗竭感', '压力叠加'].map(toItem) },
    { id: 'resilience', title: '心理复原力', side: 'psych', items: ['挫折应对', '心态弹性', '归因方式', '恢复速度'].map(toItem) },
    { id: 'social', title: '社会连接与支持', side: 'psych', items: ['人际互动', '支持系统', '关系质量', '归属感'].map(toItem) },
    { id: 'value', title: '生活满意度与价值感', side: 'psych', items: ['日常满意度', '目标感', '自我接纳', '掌控感'].map(toItem) },
    { id: 'cognition', title: '认知与注意力状态', side: 'psych', items: ['注意力', '记忆力', '思维清晰度', '杂念水平'].map(toItem) },
    { id: 'selfcare', title: '自我关怀与放松', side: 'psych', items: ['放松时间', '自我照顾', '兴趣滋养', '边界感'].map(toItem) },
];
/** 把键名包成条目。 */
function toItem(key) {
    return key === HOURS_KEY ? { key, side: 'body', hours: true } : { key, side: 'body' };
}
/** 修正心理侧条目的 side 字段（上面的 map 默认写了 body）。 */
function withSide(group) {
    return { ...group, items: group.items.map((item) => ({ ...item, side: group.side })) };
}
/** 全部 15 组（身体在前，心理在后）。 */
export const OPTIONAL_GROUPS = [
    ...BODY_GROUPS.map(withSide),
    ...PSYCH_GROUPS.map(withSide),
];
/** 全部 58 项（扁平）。 */
export const OPTIONAL_ITEMS = OPTIONAL_GROUPS.flatMap((group) => group.items);
/** 键 → 条目。 */
export const OPTIONAL_INDEX = new Map(OPTIONAL_ITEMS.map((item) => [item.key, item]));
/** 中文键 → 人话说明（1–5 分代表什么）。 */
export const OPTIONAL_HINTS = {
    睡眠时长: '填小时数，达到 7 小时记满',
    作息节律: '1 = 很乱，5 = 很稳',
    有氧运动: '1 = 没有，5 = 很充分',
    日常步数: '1 = 很少，5 = 很多',
    '体重/BMI': '1 = 偏离大，5 = 在目标区',
    基础机能: '静息心率、血压等自觉状态',
};
/** 一侧已写项数与可得分（每项平分该侧 20 分）。 */
export function optionalProgress(written, side) {
    const count = OPTIONAL_ITEMS.filter((item) => item.side === side && written[item.key] !== undefined && written[item.key] !== null).length;
    return { count, pool: side === 'body' ? 20 : 20 };
}
