/**
 * 模型可见的五个工具：把「打卡、导入、看分、建档、看今日缺项」暴露成原生能力。
 *
 * 工具只做转发与参数校验；判分逻辑仍在 `scorePayload`，抽取逻辑仍在 service，
 * 这样对话里得到的数字与面板上看到的数字必然同源。
 *
 * @module dsh-health-assessment/src/host/tools
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'

import type { ProfileRecord, ScoreResult } from '../core/types.js'
import type { HealthService } from './service.js'

/** 把任意值安全地转成模型可读文本。 */
function asText(value: unknown): { type: 'text'; text: string }[] {
  return [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }]
}

/** 摘要：只给模型看关键结论，不塞整份 JSON。 */
export function summarizeScore(result: ScoreResult): string {
  const mode = result.mode
  if (mode === 'blocked_profile') {
    const missing = (result.missing_profile as string[] | undefined) ?? []
    return `模式：blocked_profile（档案缺 ${missing.join('、') || '字段'}），本轮不打分。`
  }
  if (mode === 'redflag') {
    const flags = (result.red_flags as string[] | undefined) ?? []
    return `模式：redflag（命中 ${flags.join('、')}），停分，只给就医提示。`
  }
  if (mode === 'under7') {
    const progress = result.daily_progress as { required_completion_ratio?: number } | undefined
    return `模式：under7（${String(result.distinct_dates ?? 0)}/7 天），今日必填完成 ${Math.round((progress?.required_completion_ratio ?? 0) * 100)}%。`
  }
  const scores = result.scores as Record<string, { score: number | null; status: string }> | undefined
  const conclusion = result.conclusion as Record<string, string> | undefined
  const total = scores?.total?.score
  const body = scores?.body?.score
  const psych = scores?.psych?.score
  const lines = [
    `模式：scored，合计 ${total ?? '不合成'}（身体 ${body ?? '不合成'} / 心理 ${psych ?? '不合成'}）。`,
    conclusion?.['薄肌'] ?? '',
    conclusion?.['黄毛'] ?? '',
  ].filter(Boolean)
  const steps = (result.next_steps as string[] | undefined) ?? []
  if (steps.length > 0) lines.push(`下一步：${steps.join(' ')}`)
  return lines.join('\n')
}

/**
 * 注册全部健康工具。
 *
 * @param ctx - 宿主上下文（需要 `tools` 服务）。
 * @param service - 业务门面。
 */
export function registerTools(ctx: Context, service: HealthService): void {
  ctx.tools.register(defineTool({
    name: 'health_checkin_text',
    description: '用一句自然语言记录今天的健康打卡（蛋白质、抗阻、超负荷、自评、评价分类、睡眠等）。不要自己算分。',
    parameters: {
      text: { type: 'string', required: true, description: '用户原话，例如「今天抗阻45分钟，蛋白质140g，状态5分，不内耗」。' },
      date: { type: 'string', description: '打卡日期 YYYY-MM-DD；省略表示今天。' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => asText(value),
    },
    async execute(args) {
      const result = await service.submitText({ text: args.text, date: args.date })
      const daily = await service.daily(result.session.date)
      const parts = [
        `已写入 ${result.session.date}（来源：${result.source === 'model' ? '规则+模型' : '本地规则'}）。`,
        result.warning,
        `今日还差：${daily.missing_required_fields.length === 0 ? '无' : daily.missing_required_fields.join('；')}`,
      ].filter(Boolean)
      return parts.join('\n')
    },
  }))

  ctx.tools.register(defineTool({
    name: 'health_import_table',
    description: '导入手表或手机导出的 CSV 表格（整段文本），按列名映射成打卡记录。',
    parameters: {
      csv: { type: 'string', required: true, description: 'CSV 原文，含表头。' },
      date: { type: 'string', description: '表格没有日期列时使用的默认日期 YYYY-MM-DD。' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => asText(value),
    },
    async execute(args) {
      const result = await service.submitTable({ csv: args.csv, date: args.date })
      const flags = result.redFlags.length > 0 ? `；红旗：${result.redFlags.join('、')}` : ''
      return `已导入 ${result.imported} 天${flags}。`
    },
  }))

  ctx.tools.register(defineTool({
    name: 'health_score',
    description: '读取当前 7 天窗口的评估结果（身体 100 / 心理 100 / 合计 200）。分数只来自本地计分器，不要自行计算或改写。',
    parameters: {
      start: { type: 'string', description: '窗口开始日期 YYYY-MM-DD，可选。' },
      end: { type: 'string', description: '窗口结束日期 YYYY-MM-DD，可选。' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => asText(value),
    },
    async execute(args) {
      const window = args.start || args.end ? { start: args.start, end: args.end } : undefined
      const result = await service.score(window ? { window } : undefined)
      return summarizeScore(result)
    },
  }))

  ctx.tools.register(defineTool({
    name: 'health_profile',
    description: '读取或写入个人基础档案（身高、体重、年龄、性别、训练年限、是否有伤病）。缺字段时不出分，不能估算。',
    parameters: {
      action: { type: 'string', required: true, description: 'get 读取；set 写入。' },
      height_cm: { type: 'number', description: '身高厘米。' },
      weight_kg: { type: 'number', description: '体重千克。' },
      age: { type: 'number', description: '年龄。' },
      sex: { type: 'string', description: 'female / male / other。' },
      training_years: { type: 'number', description: '训练年限。' },
      injury: { type: 'boolean', description: '是否有伤病（只作备注，不因此停分）。' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => asText(value),
    },
    async execute(args) {
      if (args.action === 'get') {
        const profile = await service.profile()
        const score = await service.score()
        const missing = (score.mode === 'blocked_profile' ? (score.missing_profile as string[]) : []) ?? []
        return `档案：${JSON.stringify(profile)}\n缺字段：${missing.length === 0 ? '无' : missing.join('、')}`
      }
      const current = await service.profile()
      const patch: ProfileRecord = { ...current }
      for (const key of ['height_cm', 'weight_kg', 'age', 'sex', 'training_years', 'injury'] as const) {
        if (args[key] !== undefined) (patch as Record<string, unknown>)[key] = args[key]
      }
      const saved = await service.saveProfile(patch)
      return `档案已保存：${JSON.stringify(saved)}`
    },
  }))

  ctx.tools.register(defineTool({
    name: 'health_daily',
    description: '查看某一天还缺哪些必填项，以及已写了哪些选填。用于「今天还差什么」。',
    parameters: {
      date: { type: 'string', description: 'YYYY-MM-DD；省略表示今天。' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => asText(value),
    },
    async execute(args) {
      const daily = await service.daily(args.date)
      const missing = daily.missing_required_fields.length === 0
        ? '必填已齐'
        : `还差：${daily.missing_required_fields.join('；')}`
      const optional = daily.recorded_optional_fields.length === 0
        ? '选填未记录'
        : `已写选填：${daily.recorded_optional_fields.join('、')}`
      return `${daily.target_date} ${missing}；${optional}（完成度 ${Math.round(daily.required_completion_ratio * 100)}%）。`
    },
  }))
}
