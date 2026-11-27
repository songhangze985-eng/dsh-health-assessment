/**
 * 与上游 `standards/scoring.md` 对齐的字面契约。
 *
 * 这些类型是「记录形状」，不是「建议形状」：字段名、中文选填键、别名都来自
 * `scripts/score_checkin.py`，面板、工具与存储共用同一份，避免三处各写一份。
 *
 * @module dsh-health-assessment/src/core/types
 */

/** 任意 JSON 值；内核接受宽松输入，非法形状由计分器按上游规则判定。 */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

/** 可选小项的中文规范名（身体侧 30 项）。 */
export type BodyOptionalKey =
  | '睡眠时长'
  | '作息节律'
  | '睡眠深度'
  | '睡前行为'
  | '结构均衡'
  | '三餐规律'
  | '饮食质量'
  | '进食习惯'
  | '总饮水量'
  | '饮水节奏'
  | '饮品结构'
  | '有氧运动'
  | '户外日照'
  | '柔韧拉伸'
  | '运动过载'
  | '疾病伤痛'
  | '生理透支'
  | '恢复干预'
  | '久坐时长'
  | '日常步数'
  | '体态习惯'
  | '动作模式'
  | '体重/BMI'
  | '排便规律'
  | '基础机能'
  | '小症状频次'
  | '口腔卫生'
  | '用眼卫生'
  | '个人卫生'
  | '健康管理'

/** 可选小项的中文规范名（心理侧 28 项）。 */
export type PsychOptionalKey =
  | '情绪波动'
  | '负面情绪持续'
  | '情绪表达'
  | '情绪底色'
  | '日常压力'
  | '躯体化表现'
  | '耗竭感'
  | '压力叠加'
  | '挫折应对'
  | '心态弹性'
  | '归因方式'
  | '恢复速度'
  | '人际互动'
  | '支持系统'
  | '关系质量'
  | '归属感'
  | '日常满意度'
  | '目标感'
  | '自我接纳'
  | '掌控感'
  | '注意力'
  | '记忆力'
  | '思维清晰度'
  | '杂念水平'
  | '放松时间'
  | '自我照顾'
  | '兴趣滋养'
  | '边界感'

/** 身体必填。上游只认这三块，缺一块该侧 80 不合成。 */
export interface BodyRequired {
  protein_g?: number | string | null
  protein_ratio?: number | string | null
  protein_likert?: number | string | null
  resistance_sets?: number | string | null
  resistance_load_kg?: number | string | null
  resistance_likert?: number | string | null
  resistance_done?: boolean | null
  resistance_minutes?: number | string | null
  overload?: boolean | number | string | null
  progressive_overload?: boolean | number | string | null
  overload_likert?: number | string | null
  [key: string]: any
}

/** 心理必填。自评分与评价分类各 40。 */
export interface PsychRequired {
  execution_likert?: number | string | null
  self_rating_1_to_5?: number | string | null
  likert?: number | string | null
  classification?: string | null
  feedback_category?: string | null
  [key: string]: any
}

/** 一条打卡记录。`date` 为 `YYYY-MM-DD`；`date_defaulted` 表示日期是补的，仍只算 1 天。 */
export interface SessionRecord {
  date?: string
  date_defaulted?: boolean
  red_flags?: string[]
  raw_text?: string
  text?: string
  note?: string
  body_required?: BodyRequired
  psych_required?: PsychRequired
  optional?: Record<string, Json | undefined>
  [key: string]: any
}

/** 个人档案。六项必填缺一即 `blocked_profile`。 */
export interface ProfileRecord {
  codename?: string
  height_cm?: number | string | null
  weight_kg?: number | string | null
  age?: number | string | null
  sex?: string | null
  training_years?: number | string | null
  injury?: boolean | string | null
  targets?: {
    protein_g_per_kg?: number | string
    protein_source?: string
    resistance_sessions_per_7d?: number | string
    [key: string]: any
  }
  [key: string]: any
}

/** 计分输入。窗口缺省时统计全部记录。 */
export interface ScorePayload {
  profile?: ProfileRecord
  sessions?: SessionRecord[]
  window?: { start?: string; end?: string } | null
}

/** 一侧的必填评分结果。 */
export interface RequiredScore {
  status: 'scored' | '无法评分'
  score: number | null
  parts?: Record<string, number | null>
  points?: Record<string, number>
  target_protein_g?: number
  protein_source?: string
  execution?: number | null
  classification?: number | null
}

/** 一侧的选填评分结果。 */
export interface OptionalScore {
  status: 'scored' | '无法评分'
  score: number | null
  items: { item: string; mean_ratio: number; points: number }[]
}

/** 必填与选填的合成结果。 */
export interface CombinedScore {
  status: 'scored' | '不合成'
  score: number | null
}

/** 今日缺项。 */
export interface DailyProgress {
  target_date: string
  required_completion_ratio: number
  missing_required_fields: string[]
  recorded_optional_fields: string[]
}

/** 红旗明细。 */
export interface RedFlagDetail {
  date: string
  flag: string
  source: 'explicit' | 'text_scan'
}

/** 计分结果。四种 mode 的字段不完全相同，故用宽松结构承载。 */
export interface ScoreResult {
  mode: 'blocked_profile' | 'redflag' | 'under7' | 'scored'
  [key: string]: any
}
