# dsh-health-assessment

个人发展与健康评估的 DSH 插件：七天内确定性计分，右侧栏面板、模型工具与桌宠播报。

> 非诊断。分数只用于记录习惯，不诊断、不开药、不解读化验或影像。

## 它做什么

- **一句话打卡**：规则先解析（蛋白质、抗阻、超负荷、1–5 自评、评价分类、睡眠等），规则没写全时才请模型补。
- **七个不同日期**：满 7 天给出身体 100 + 心理 100 = 合计 200；不满 7 天只说今天还差什么。
- **分数只来自本地计分器**：`src/core/score.ts` 是唯一入口，模型与前端都不重算。
- **红旗停分**：胸痛、昏厥、晕厥、自伤、轻生、自行停药、急性剧痛、呼吸困难、异常心悸、骨裂、关节急性肿胀。紧邻「没有 / 无 / 否认 / 未出现 / 未诉」的不算。停分后只提示就医。
- **右侧栏面板**：今日 / 打卡 / 档案 / 评分 / 历史 / 设置 六个视图。
- **桌宠播报**：出分或分数变动 ≥5 时，让 `dsh-pet` 说一句，每天最多一次。
- **每日追问**：当天首次打开时在指定工作区开一个新会话追问缺项；可另设定时时刻；追问后 5 小时（可改）没回复就再开一个会话升级提醒。

## 安装

插件是独立 npm 包 + `cordis.patch.yml` 配置层，按 DSH 官方机制装进 profile：

```bash
# 1. 构建（需要 Node ≥ 22.12 与 pnpm）
pnpm install
pnpm run build

# 2. 打包
pnpm pack            # 产出 dsh-health-assessment-0.1.0.tgz

# 3. 装进当前 profile
dsh plugin --profile desktop add "file:$PWD/dsh-health-assessment-0.1.0.tgz"
```

装完重启 DSH。右侧栏会出现「健康」页签；对话里模型可以调用 `health_checkin_text`、`health_import_table`、`health_score`、`health_profile`、`health_daily`。

## 数据在哪

默认 `~/.dsh/health-assessment`：

```text
~/.dsh/health-assessment/
├── profile.json               # 六项必填档案
├── sessions/YYYY-MM-DD.json   # 每天一条，多来源合并
├── analyses/                  # 评估快照
├── settings.json              # 插件设置
└── followup.json              # 追问与播报状态（防重复轰炸）
```

想把老的记忆库搬过来：「设置 → 从旧记忆库导入」填目录即可。导入只读旧库、只写新库。

插件配置（`cordis.patch.yml` 那一行）有两个字段：`memoryRoot`（换库）与 `petId`（桌宠 id）。

## 计分口径

| 部分 | 分值 | 规则 |
| --- | --- | --- |
| 身体必填 | 80 | 蛋白质、抗阻、超负荷三项各 80/3 |
| 心理必填 | 80 | 1–5 自评 40 + 评价分类 40 |
| 身体选填 | 20 | 只在写过的小项之间平分，一项没写记「无法评分」，不记 0 |
| 心理选填 | 20 | 同上 |

- 必填缺任何一块，该侧 100 不合成，总分也不合成。
- 抗阻按自然日跨度算期望次数：`每周次数 × 跨度/7`，默认每周 3 次。
- 不满 7 个不同日期不出 200 分。

## 与上游的关系

行为契约来自 [songhangze985-eng/health-assessment](https://github.com/songhangze985-eng/health-assessment) 的 `SKILL.md`、`standards/` 与 `scripts/score_checkin.py`。本仓把计分内核移植到 TypeScript，并保留 Python 脚本作为对照轨：

```bash
pnpm test                                   # 19 个官方用例
pnpm diff                                   # 500 组随机载荷与 Python 逐字段差分
python3 tools/py_batch.py in.json out.json  # 手动跑一批
```

差分要求：数值容差 0.01，字符串与结构必须一致；不等齐不算通过。

## 隐私

- 文字与 CSV 本地规则优先；只有规则提不全时才把文本发给模型。
- 图片必须点「确认发送」才会离开本机。
- 不发遥测；记忆库只在本机。

## 已知限制

- 图片识别依赖你在设置里指定的模型具备视觉能力；宿主没有附件服务时会明确报错，而不是假装识别成功。
- 「自动开会话追问」走宿主的 `agents.create`，宿主没有该服务时降级为面板气泡提示。
- 面板默认假设 DSH 右侧栏提供 `sidebarRightTabs`；没有时插件其余功能照常，只是没有页签。

## 协议

MIT。
