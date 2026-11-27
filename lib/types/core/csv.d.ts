/**
 * 极简 CSV 解析：只做健康表格真正会遇到的事。
 *
 * 上游用 `csv.Sniffer` 猜分隔符；这里按首行的 `,` `\t` `;` 出现次数取最多者，
 * 再按 RFC 4180 处理双引号与换行。BOM 会被吃掉，因为手表导出几乎都带。
 *
 * @module dsh-health-assessment/src/core/csv
 */
/** 表格行：列名 → 字符串单元格。 */
export type CsvRow = Record<string, string>;
/** 把一个 CSV 文本切成二维单元格。 */
export declare function parseCsvCells(text: string, delimiter: string): string[][];
/**
 * CSV 文本 → 行对象数组。
 *
 * 空行与全空行会被丢掉；首行视作表头，重复列名后者覆盖前者（与 Python
 * `csv.DictReader` 的行为一致）。
 */
export declare function parseCsv(text: string): CsvRow[];
