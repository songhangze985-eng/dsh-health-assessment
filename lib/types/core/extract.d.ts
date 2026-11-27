/**
 * 表格与自然语言的规则提取：上游 `_heuristic_extract`、`parse_health_table_bytes`
 * 与列名映射的移植。
 *
 * 这里只做「把已经写下的东西读成结构化字段」，不算分、不补数字。模型抽取在
 * host 侧另有一层，失败时回落到本文件，因此这里的输出必须是确定的。
 *
 * @module dsh-health-assessment/src/core/extract
 */
import type { SessionRecord } from './types.js';
/** 表格列名 → 规范字段（与上游 `COLUMN_ALIASES` 一致）。 */
export declare const COLUMN_ALIASES: Record<string, readonly string[]>;
/** 允许写进 `feedback_category` 的分类。 */
export declare const VALID_FEEDBACK: Set<string>;
/** 表格行：列名 → 原始单元格。 */
export type TableRow = Record<string, unknown>;
/** 命中列名：取最长匹配，避免「睡眠」误吞「睡眠时长」。 */
export declare function matchColumn(header: string): string | null;
/** 单元格转布尔；认不出的返回 null。 */
export declare function asBool(value: unknown): boolean | null;
/** 单元格转数字；去掉千分位与单位后解析。 */
export declare function asFloat(value: unknown): number | null;
/** 单元格转 `YYYY-MM-DD`；认不出时用默认日期。 */
export declare function asDate(value: unknown, defaultDate?: string | null): string;
/**
 * 表格行 → 按日期合并的打卡记录。
 *
 * 同一张表里同一天多行会合并成一条；列名不认识的单元格直接丢弃，不猜。
 */
export declare function rowsToSessions(rows: TableRow[], defaultDate?: string | null): SessionRecord[];
/**
 * 规则提取：把一句中文自述读成结构化打卡。
 *
 * 与上游同口径——只认写明的数字与词，认不出就不写；`red_flags` 先留空，
 * 由 `attachKnownFlags` 再扫一遍文本。
 */
export declare function heuristicExtract(text: string, targetDate: string): SessionRecord;
/** 把文本里扫到的红旗补进 `red_flags`（不重复）。 */
export declare function attachKnownFlags(session: SessionRecord): SessionRecord;
