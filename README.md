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

## 打开界面

插件在宿主上注册了一个独立页面，直接用浏览器打开（端口换成你当前 GUI 的端口）：

```text
http://127.0.0.1:<DSH_PORT>/health-assessment-8221/ui
```

左侧是导航：**今日 / 打卡 / 档案 / 评分 / 监测 / 历史 / 设置**。页面由宿主直接渲染，
不依赖 DSH 的浏览器插件加载链，所以即使内嵌面板没挂上也能用。

右侧栏页签（`sidebar.right.pane.tab`）与左侧栏入口（`sidebar.footer.action`）是另一条
并行通道，供 DSH 内部直接打开；那条通道要求 client 插件进入 boot 图，见「已知限制」。

## 页面里能做什么

- **今日**：今日完成度、当前 200 分评估、红旗、还差哪几项必填。
- **打卡**：一句话打卡（可选日期）、粘贴 CSV 导入。
- **档案**：身高/体重/年龄/性别/训练年限/伤病六项，缺项时不出分。
- **评分**：合计/身体/心理、必填明细、结论、最多三条下一步。
- **监测**：最近 14 天必填完成度柱状图、有记录天数、距满 7 天、红旗计数。
- **历史**：最近 60 天每天命中了哪些必填。
- **设置**：抽取模型（provider/model）、每日追问开关与时刻、升级小时数、工作区路径、
  桌宠开关、图片确认、从旧记忆库导入。

## 接口

面板与页面对的都是同一组路由（前缀 `/health-assessment-8221`）：

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| GET | `/ui` | 独立界面 HTML |
| GET | `/overview` | 今日进度 + 评估 + 红旗 + 设置 |
| GET | `/score` | 当前窗口评估 |
| GET | `/sessions` | 最近记录 |
| GET / POST | `/profile` | 读 / 写档案 |
| POST | `/checkin/text` | 一句话打卡 |
| POST | `/checkin/table` | 粘贴 CSV 导入 |
| POST | `/checkin/image` | 图片抽取（需先 `confirmed:true`） |
| GET / POST | `/settings` | 读 / 写设置 |
| POST | `/import` | 从旧记忆库导入 |
| GET | `/followup` | 追问与气泡状态 |
| POST | `/followup/ask` | 立刻跑一次今日追问（带诊断） |
| POST | `/followup/reply` | 标记用户已回复 |
| POST | `/pet/say` | 手动投喂桌宠气泡 |
| POST | `/client-hello` | 浏览器侧插件加载心跳 |

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
- **浏览器内嵌面板（左栏按钮 / 右侧页签）在 DSH 0.2.2-rc.5 上没能进入 boot 图**：`/client-hello`
  心跳始终为 0，说明浏览器从未执行这份 client bundle；因此主界面改为宿主渲染的 `/ui` 页面。
  独立页面这条通道与 DSH 版本无关，随时可用。
- 「自动开会话追问」有两条通道，都做了落盘自证：
  1. `agents.create` + `agent.followup`：在 **DSH 0.2.2-rc.5** 上会话能建出来，但消息不落盘、也不启动轮次；
  2. `sessionController.createSession` + `prompt`：该组合里这个服务未挂载（探测返回 undefined）。

  两条都失败时，插件会删掉空壳会话，改用「桌宠气泡 + 面板顶部追问」，并把原因写进 `followup.json` 的 `lastAskDetail`。宿主哪天修好任一条通道，无需改代码即可自动恢复真正的建会话追问。
- 面板默认假设 DSH 右侧栏提供 `sidebarRightTabs`；没有时插件其余功能照常，只是没有页签。

## 协议

MIT。
