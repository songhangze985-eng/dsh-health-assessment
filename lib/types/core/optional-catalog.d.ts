/**
 * 选填项目录：按 `standards/domains.md` 的 15 个维度分组，共 58 项。
 *
 * 键名必须与 `score.ts` 的 `BODY_OPTIONAL` / `PSYCH_OPTIONAL` 完全一致，
 * 因为计分器按这些中文字面量取分。这里只负责「怎么分组、怎么显示」，
 * 不复制计分逻辑，也不引入新的键。
 *
 * @module dsh-health-assessment/src/core/optional-catalog
 */
/** 一个选填小项。 */
export interface OptionalItem {
    /** 与计分器一致的原文键名。 */
    key: string;
    /** 属于身体侧还是心理侧（决定 20 分归属哪一池）。 */
    side: 'body' | 'psych';
    /** 该项是否按「小时数」而非 1–5 记分。 */
    hours?: boolean;
}
/** 一个维度分组。 */
export interface OptionalGroup {
    /** 分组 id，用于折叠状态。 */
    id: string;
    /** 分组标题（来自 domains.md 的维度名）。 */
    title: string;
    side: 'body' | 'psych';
    items: OptionalItem[];
}
/** 全部 15 组（身体在前，心理在后）。 */
export declare const OPTIONAL_GROUPS: OptionalGroup[];
/** 全部 58 项（扁平）。 */
export declare const OPTIONAL_ITEMS: OptionalItem[];
/** 键 → 条目。 */
export declare const OPTIONAL_INDEX: Map<string, OptionalItem>;
/** 中文键 → 人话说明（1–5 分代表什么）。 */
export declare const OPTIONAL_HINTS: Record<string, string>;
/** 一侧已写项数与可得分（每项平分该侧 20 分）。 */
export declare function optionalProgress(written: Record<string, unknown>, side: 'body' | 'psych'): {
    count: number;
    pool: number;
};
