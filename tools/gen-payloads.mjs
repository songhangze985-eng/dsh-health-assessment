/**
 * 随机载荷生成器：给 JS 内核与 Python 内核喂同一批输入。
 *
 * 生成空间刻意贴着上游的边界：必填缺项、布尔与数字混淆、别名、日期重复、
 * 窗口跨月、红旗与否定的组合。种子固定，失败可复现。
 *
 * @module dsh-health-assessment/tools/gen-payloads
 */

/** 线性同余伪随机，固定种子即可复现整批样本。 */
export function makeRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

const BODY_OPTIONAL = [
  '睡眠时长', '作息节律', '睡眠深度', '三餐规律', '饮食质量', '总饮水量', '有氧运动',
  '户外日照', '恢复干预', '久坐时长', '日常步数', '基础机能', '健康管理',
]
const PSYCH_OPTIONAL = [
  '情绪波动', '日常压力', '耗竭感', '心态弹性', '人际互动', '目标感', '注意力',
  '自我照顾', '边界感', '兴趣滋养',
]
const ALIASES = ['sleep_quality', 'anti_inflammatory_diet', 'hydration', 'stress_relief', 'focus_state', 'self_care']
const FLAGS = ['胸痛', '昏厥', '自伤', '自行停药', '急性剧痛', '呼吸困难', '异常心悸', '晕厥', '轻生', '骨裂', '关节急性肿胀']

/** 从数组里按随机数取一个。 */
function pick(rand, list) {
  return list[Math.floor(rand() * list.length)]
}

/** 生成一份档案。 */
function makeProfile(rand) {
  const profile = {}
  const full = rand() > 0.15
  if (full) {
    profile.codename = 'rand'
    profile.height_cm = 150 + Math.floor(rand() * 41)
    profile.weight_kg = 55 + Math.floor(rand() * 56)
    profile.age = 18 + Math.floor(rand() * 43)
    profile.sex = rand() > 0.5 ? 'male' : 'female'
    profile.training_years = Math.floor(rand() * 9)
    profile.injury = rand() > 0.7
  } else if (rand() > 0.4) {
    // 部分字段，制造 blocked_profile
    profile.height_cm = 170
    profile.weight_kg = 70
  }
  if (rand() > 0.7) {
    profile.targets = {}
    if (rand() > 0.4) profile.targets.protein_g_per_kg = Number((1.2 + rand() * 1.8).toFixed(1))
    if (rand() > 0.5) profile.targets.protein_source = pick(rand, ['literature_default_1.6_within_1.4_2.0', 'user_outside_literature'])
    if (rand() > 0.5) profile.targets.resistance_sessions_per_7d = 1 + Math.floor(rand() * 6)
  }
  return profile
}

/** 生成身体必填的组合。 */
function makeBody(rand) {
  const body = {}
  const kind = rand()
  if (kind < 0.45) body.protein_g = 50 + Math.floor(rand() * 160)
  else if (kind < 0.62) body.protein_ratio = Number(rand().toFixed(2))
  else if (kind < 0.77) body.protein_likert = 1 + Math.floor(rand() * 5)
  else if (kind < 0.82) body.protein_likert = pick(rand, [0, 6, true, null])

  const resistance = rand()
  if (resistance < 0.4) {
    body.resistance_sets = 1 + Math.floor(rand() * 5)
    body.resistance_load_kg = 20 + Math.floor(rand() * 80)
  } else if (resistance < 0.55) body.resistance_likert = 1 + Math.floor(rand() * 5)
  else if (resistance < 0.7) body.resistance_done = rand() > 0.3
  else if (resistance < 0.85) body.resistance_minutes = pick(rand, [0, 15, 45, 90, true])

  const overload = rand()
  if (overload < 0.4) body.overload = rand() > 0.4
  else if (overload < 0.6) body.progressive_overload = rand() > 0.5
  else if (overload < 0.75) body.progressive_overload = Number(rand().toFixed(2))
  else if (overload < 0.85) body.overload_likert = 1 + Math.floor(rand() * 5)
  return body
}

/** 生成心理必填的组合。 */
function makePsych(rand) {
  const psych = {}
  const rating = rand()
  if (rating < 0.5) psych.execution_likert = 1 + Math.floor(rand() * 5)
  else if (rating < 0.7) psych.self_rating_1_to_5 = 1 + Math.floor(rand() * 5)
  else if (rating < 0.85) psych.likert = 1 + Math.floor(rand() * 5)
  else if (rating < 0.9) psych.execution_likert = pick(rand, [0, 6, null])

  const label = rand()
  if (label < 0.45) psych.classification = 'kept_and_changed'
  else if (label < 0.7) psych.classification = 'discarded_insult'
  else if (label < 0.85) psych.classification = 'invalid'
  else if (label < 0.95) psych.feedback_category = pick(rand, ['kept_and_changed', 'invalid', 'other'])
  return psych
}

/** 生成选填。 */
function makeOptional(rand) {
  const optional = {}
  const count = Math.floor(rand() * 4)
  for (let i = 0; i < count; i += 1) {
    const key = rand() > 0.3 ? pick(rand, [...BODY_OPTIONAL, ...PSYCH_OPTIONAL]) : pick(rand, ALIASES)
    const shape = rand()
    let value
    if (shape < 0.35) value = 1 + Math.floor(rand() * 5)
    else if (shape < 0.5) value = { likert: 1 + Math.floor(rand() * 5) }
    else if (shape < 0.62) value = { actual: Math.floor(rand() * 10), target: 1 + Math.floor(rand() * 10) }
    else if (shape < 0.72) value = { hours: Number((3 + rand() * 6).toFixed(1)) }
    else if (shape < 0.82) value = pick(rand, [5, 6, 7, 8, 9])
    else if (shape < 0.9) value = true
    else value = null
    optional[key] = value
  }
  return optional
}

/** 生成一天的记录。 */
function makeSession(rand, index) {
  const session = {
    date: `2026-${rand() > 0.5 ? '09' : '10'}-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`,
    date_defaulted: rand() > 0.9,
    red_flags: [],
    body_required: makeBody(rand),
    psych_required: makePsych(rand),
    optional: makeOptional(rand),
  }
  const flagRoll = rand()
  if (flagRoll < 0.06) session.red_flags = [pick(rand, FLAGS)]
  const textRoll = rand()
  if (textRoll < 0.06) session.note = `今天${pick(rand, FLAGS)}`
  else if (textRoll < 0.12) session.note = `无${pick(rand, FLAGS)}，也没有${pick(rand, FLAGS)}`
  if (rand() > 0.85) session.raw_text = '正常打卡，无异常'
  return session
}

/**
 * 生成一组随机载荷。
 *
 * @param seed - 种子；同一种子必然产出同一批样本。
 * @param count - 组数。
 */
export function generatePayloads(seed, count) {
  const rand = makeRandom(seed)
  const payloads = []
  for (let i = 0; i < count; i += 1) {
    const sessions = []
    const sessionCount = Math.floor(rand() * 13)
    for (let j = 0; j < sessionCount; j += 1) sessions.push(makeSession(rand, j))
    const payload = { profile: makeProfile(rand), sessions }
    if (rand() > 0.75) {
      payload.window = {
        start: `2026-09-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`,
        end: `2026-10-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`,
      }
    }
    payloads.push(payload)
  }
  return payloads
}
