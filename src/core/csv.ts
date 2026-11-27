/**
 * 极简 CSV 解析：只做健康表格真正会遇到的事。
 *
 * 上游用 `csv.Sniffer` 猜分隔符；这里按首行的 `,` `\t` `;` 出现次数取最多者，
 * 再按 RFC 4180 处理双引号与换行。BOM 会被吃掉，因为手表导出几乎都带。
 *
 * @module dsh-health-assessment/src/core/csv
 */

/** 表格行：列名 → 字符串单元格。 */
export type CsvRow = Record<string, string>

/** 猜分隔符：首行里出现最多的候选。 */
function sniffDelimiter(sample: string): string {
  const firstLine = sample.split('\n', 1)[0] ?? ''
  const candidates = [',', '\t', ';']
  let best = ','
  let bestCount = -1
  for (const candidate of candidates) {
    const count = firstLine.split(candidate).length - 1
    if (count > bestCount) {
      best = candidate
      bestCount = count
    }
  }
  return bestCount > 0 ? best : ','
}

/** 把一个 CSV 文本切成二维单元格。 */
export function parseCsvCells(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }
      continue
    }
    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') {
      cell += char
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

/**
 * CSV 文本 → 行对象数组。
 *
 * 空行与全空行会被丢掉；首行视作表头，重复列名后者覆盖前者（与 Python
 * `csv.DictReader` 的行为一致）。
 */
export function parseCsv(text: string): CsvRow[] {
  const clean = text.replace(/^\uFEFF/, '')
  const sample = clean.slice(0, 4096)
  const delimiter = sniffDelimiter(sample)
  const cells = parseCsvCells(clean, delimiter).filter((row) => row.some((cell) => cell.trim() !== ''))
  if (cells.length === 0) return []
  const headers = (cells[0] ?? []).map((header) => header.trim())
  const rows: CsvRow[] = []
  for (const row of cells.slice(1)) {
    const record: CsvRow = {}
    for (let i = 0; i < headers.length; i += 1) {
      const header = headers[i]
      if (!header) continue
      record[header] = row[i] ?? ''
    }
    rows.push(record)
  }
  return rows
}
