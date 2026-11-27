
import { createRoot } from 'react-dom/client'
import { HealthView } from '../../src/client/health.tsx'
import { injectStyles } from '../../src/client/styles.ts'

// 宿主在 apply() 里注入样式；验收台必须做同样的事，否则量到的是无样式页面。
injectStyles()

const overview = {"date":"2026-11-28","distinctDates":3,"redFlags":[],"profileMissing":["height_cm","weight_kg","age","sex","training_years","injury"],"checklist":[{"key":"protein","label":"蛋白质摄入","hint":"写克数，例如「蛋白质 120g」","done":false,"value":""},{"key":"resistance","label":"抗阻训练","hint":"写训练内容或分钟数，例如「抗阻 45 分钟」","done":true,"value":"45 分钟"},{"key":"overload","label":"渐进超负荷","hint":"写是否加重量或多做一组","done":false,"value":""},{"key":"rating","label":"执行力与心态自评","hint":"1–5 分，例如「状态 4 分」","done":true,"value":"4 分"},{"key":"feedback","label":"外界评价处理","hint":"可测量就采纳，人身攻击就丢弃","done":false,"value":""}],"daily":{"required_completion_ratio":0.4},"score":{"mode":"blocked_profile","scores":{"total":{"score":null},"body":{"score":null},"psych":{"score":null}},"next_steps":["补齐建库字段后再记。缺的字段不能估算。"]},"settings":{"autoPromptOnOpen":true,"dailyAskEnabled":true,"escalateHours":5,"petEnabled":true,"confirmImageUpload":true},"profile":{}}
const sessions = [{"date":"2026-11-28","body_required":{"resistance_minutes":45},"psych_required":{"execution_likert":4}},{"date":"2026-11-27","body_required":{"protein_g":130,"resistance_done":true,"progressive_overload":true},"psych_required":{"execution_likert":5,"classification":"kept_and_changed"}},{"date":"2026-11-26","body_required":{"protein_g":120},"psych_required":{}}]

const realFetch = globalThis.fetch
globalThis.fetch = async (input, init) => {
  const url = String(input)
  if (url.includes('/overview')) return new Response(JSON.stringify(overview), { status: 200 })
  if (url.includes('/sessions')) return new Response(JSON.stringify(sessions), { status: 200 })
  if (url.includes('/workspaces')) return new Response(JSON.stringify({ rows: [{ path: '/Users/zzz/Documents/deepseek-harness/default-workspace', name: 'default-workspace' }] }), { status: 200 })
  void realFetch
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}

createRoot(document.getElementById('root')).render(<HealthView />)
