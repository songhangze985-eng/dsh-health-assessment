# dsh-health-assessment

个人发展与健康评估的 DSH 插件：七天内确定性计分，左侧栏入口 + 独立界面、五个模型工具、桌宠播报。

> 非诊断。分数只用于记录习惯，不诊断、不开药、不解读化验或影像。

## 这是什么关系（两个仓库不是同一个东西）

| 仓库 | 是什么 | 技术栈 |
| --- | --- | --- |
| [health-assessment](https://github.com/songhangze985-eng/health-assessment) | 原项目：OpenClaw Skill + 本地 Python 服务 + VPet/菜单栏桌宠 | Python + Markdown |
| **本仓库 dsh-health-assessment** | 把原项目**转换成 DSH 插件**：宿主插件 + 浏览器面板 + 模型工具 | TypeScript + Cordis |

计分口径、红旗词表、档案六项必填都沿自原项目；本仓库把计分内核移植成 TypeScript，
并保留 Python 原脚本作为对照轨（逐字段差分）。原项目的桌宠/HTTP 服务在本插件里
改成「DSH 左侧栏入口 + 独立界面 + dsh-pet 气泡」。

## 它做什么

- **一句话打卡**：规则先解析（蛋白质、抗阻、超负荷、1–5 自评、评价分类、睡眠等），规则没写全时才请模型补。
- **七个不同日期**：满 7 天给出身体 100 + 心理 100 = 合计 200；不满 7 天只说今天还差什么。
- **分数只来自本地计分器**：`src/core/score.ts` 是唯一入口，模型与前端都不重算。
- **红旗停分**：胸痛、昏厥、晕厥、自伤、轻生、自行停药、急性剧痛、呼吸困难、异常心悸、骨裂、关节急性肿胀。紧邻「没有 / 无 / 否认 / 未出现 / 未诉」的不算。停分后只提示就医。
- **左侧栏入口 + 独立界面**：左侧栏底部「♥ 健康」按钮，点开是一块独立健康中心（今日 / 打卡 / 档案 / 评分 / 历史 / 设置 六个视图），Esc 关闭；右侧栏也保留同名页签。
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

桌面版没有全局 `dsh` 命令时，等价做法是在 profile 目录里直接装，并把包名加进 `dsh.profile.bundles`：

```bash
cd ~/.dsh/profiles/desktop
pnpm add "file:$PWD/dsh-health-assessment-0.1.0.tgz"
# 然后在 package.json 的 dsh.profile.bundles 末尾追加 "dsh-health-assessment"
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

## 升级说明

- **0.1.1**：跨插件服务（默认模型 / webServer / agents）改为软取，未注入时降级而不是抛错。
- **0.1.5**：每日追问加了「会话自证」——建完会话后回读会话日志确认消息真的落盘；没落盘就删掉这个空壳会话，改走桌宠气泡 + 面板提示。出分播报与追问提示改为宿主直接投给桌宠，不再依赖面板是否打开。
- **0.1.6**：追问再加第二通道 `sessionController.createSession + prompt`（浏览器新建会话用的同一条服务）；两条都失败才降级。
- 装完或升级后需要**重启 DSH**；也可以先在 profile 的 `dsh.profile.bundles` 里摘掉包名、等几秒再加回来，触发一次热卸载/重挂。

## 已知限制

- 图片识别依赖你在设置里指定的模型具备视觉能力；宿主没有附件服务时会明确报错，而不是假装识别成功。
- 「自动开会话追问」有两条通道，都做了落盘自证：
  1. `agents.create` + `agent.followup`：在 **DSH 0.2.2-rc.5** 上会话能建出来，但消息不落盘、也不启动轮次；
  2. `sessionController.createSession` + `prompt`：该组合里这个服务未挂载（探测返回 undefined）。

  两条都失败时，插件会删掉空壳会话，改用「桌宠气泡 + 面板顶部追问」，并把原因写进 `followup.json` 的 `lastAskDetail`。宿主哪天修好任一条通道，无需改代码即可自动恢复真正的建会话追问。
- 面板默认假设 DSH 右侧栏提供 `sidebarRightTabs`；没有时插件其余功能照常，只是没有页签。

## 协议

MIT。
