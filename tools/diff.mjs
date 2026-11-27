/**
 * JS 内核 ↔ Python 内核差分对照。
 *
 * 生成固定种子的随机载荷，分别喂给两侧计分器，逐字段比对。
 * 数值容差 0.01（两侧四舍五入实现不同），字符串与结构必须完全一致。
 *
 * 用法：tsx tools/diff.mjs [组数] [种子]
 *
 * @module dsh-health-assessment/tools/diff
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { scorePayload } from '../src/core/score.js'
import { generatePayloads } from './gen-payloads.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const count = Number(process.argv[2] ?? 500)
const seed = Number(process.argv[3] ?? 20261128)

/** 去掉 undefined 键，对齐 Python dict 的键集合。 */
function canonical(value) {
  return JSON.parse(JSON.stringify(value))
}

/** 递归比较，返回差异描述数组。 */
function compare(actual, expected, path, diffs) {
  if (typeof expected === 'number' && typeof actual === 'number') {
    if (Math.abs(actual - expected) > 0.01) diffs.push(`${path}: ${actual} ≠ ${expected}`)
    return
  }
  if (Array.isArray(expected) || Array.isArray(actual)) {
    if (!Array.isArray(expected) || !Array.isArray(actual)) {
      diffs.push(`${path}: 数组类型不一致`)
      return
    }
    if (actual.length !== expected.length) {
      diffs.push(`${path}: 长度 ${actual.length} ≠ ${expected.length}`)
      return
    }
    for (let i = 0; i < expected.length; i += 1) compare(actual[i], expected[i], `${path}[${i}]`, diffs)
    return
  }
  if (expected !== null && actual !== null && typeof expected === 'object' && typeof actual === 'object') {
    const actualKeys = Object.keys(actual).sort()
    const expectedKeys = Object.keys(expected).sort()
    if (actualKeys.join('|') !== expectedKeys.join('|')) {
      diffs.push(`${path}: 键集合 ${actualKeys.join(',')} ≠ ${expectedKeys.join(',')}`)
      return
    }
    for (const key of expectedKeys) compare(actual[key], expected[key], `${path}.${key}`, diffs)
    return
  }
  if (actual !== expected) diffs.push(`${path}: ${JSON.stringify(actual)} ≠ ${JSON.stringify(expected)}`)
}

const payloads = generatePayloads(seed, count)
const dir = mkdtempSync(join(tmpdir(), 'ha-diff-'))
const inputPath = join(dir, 'in.json')
const outputPath = join(dir, 'out.json')
writeFileSync(inputPath, JSON.stringify(payloads))

execFileSync('python3', [join(root, 'tools', 'py_batch.py'), inputPath, outputPath], {
  stdio: ['ignore', 'pipe', 'pipe'],
})
const expectedAll = JSON.parse(readFileSync(outputPath, 'utf8'))

let failures = 0
const samples = []
for (let i = 0; i < payloads.length; i += 1) {
  const actual = canonical(scorePayload(payloads[i]))
  const expected = canonical(expectedAll[i])
  const diffs = []
  compare(actual, expected, `#${i}`, diffs)
  if (diffs.length > 0) {
    failures += 1
    if (samples.length < 8) samples.push({ index: i, diffs: diffs.slice(0, 6), payload: payloads[i] })
  }
}

console.log(`样本 ${payloads.length}，差异 ${failures}`)
for (const sample of samples) {
  console.log(`\n样本 #${sample.index}`)
  for (const line of sample.diffs) console.log('  ' + line)
}
if (failures > 0) {
  writeFileSync(join(root, 'tools', 'diff-failures.json'), JSON.stringify(samples, null, 2))
  process.exitCode = 1
}
