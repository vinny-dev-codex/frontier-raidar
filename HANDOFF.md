# Frontier Radar 项目续接说明

## 项目目标

继续完成一个供个人学习使用的低成本前沿信息 PWA：追踪商业、AI、科技、心理、社会与未来趋势中的可信来源，发现新内容，并只在取得可验证原文后生成可追溯的知识卡片。项目是个人信息库，不是创业/商业化项目。

## 目前项目位置与迁移

- 当前工作目录：`C:\Users\35467\Documents\ChatGPT\爬信息工作流 2`
- 原项目目录：`E:\AI\Codex\FrontierRadar`（原目录保留，没有删除或修改）
- 本文件夹现已包含原项目源码、配置、文档、数据库迁移、演示数据和工作流。
- 当前文件夹原有空 Git 仓库保留；原项目也没有提交记录或远程仓库。源码文件已迁入，但未复制 `.git`、`node_modules`、`.next`。依赖与构建产物可重建。
- 原项目 `.env.local` 不存在；没有复制任何 API 密钥。`.env.example` 已迁入。

## 两个旧任务

- 产品可行性与信息结构讨论：[分析个人前沿资讯APP可行性](codex://threads/01a0af84-402f-7c12-a1d1-d2223522ff79)
- 应用实现与后续接入：[旧开发任务](codex://threads/01a0bbea-1e39-7380-8d0c-ff0c2b4923e5)

后续以用户最后确认并已落入当前代码/实现的决定为准；早期讨论中已被修改的选项不再视为当前要求。

## 已确认的产品规则

- 首批 12 个来源：The Batch、One Useful Thing、MIT Technology Review、Bloomberg Primer、Stanford GSB View From The Top、HBR IdeaCast、Knowledge at Wharton、Acquired、Lenny’s Podcast、Hidden Brain、Speaking of Psychology、Freakonomics Radio。
- 首阶段真实发现已接入 The Batch、Acquired、Hidden Brain；其余来源登记后仍需逐个验证入口和文稿可用性。
- 内容发现可来自官方站点、Newsletter/RSS、YouTube、Podcast RSS 等。先匹配同一内容，再跨平台找文字稿；不同剪辑版本的时间戳不可互相套用。完全匹配才自动合并，不确定时待确认。
- 视频/Podcast 字幕顺序：OS 官方字幕/文稿 → CC → 平台或其他位置已有且可验证的字幕（PLT/EXT）。都找不到时只展示标题、来源、日期、链接和“暂无找到字幕”，不生成摘要、关键点、分析或图表。禁止语音识别、音视频下载、按标题/简介猜正文或绕过付费墙。
- 文章只使用官方正文或官方 RSS 正文；无法取得时标记“暂未获取原文”，不生成分析。
- 无字幕/正文内容计划在发布后 24 小时、72 小时、7 天及之后每周重新检查。
- 有原文时：中文 AI 摘要、5–10 个中文关键点、英文原文主引文及所有实质不同的支持/补充/案例/限定/对比/反驳/风险证据、中文拓展分析。补充证据不设固定数量上限；重复证据可合并。
- 引文必须来自程序按 segment ID 从原文精确回填；保留位置/时间戳、说话人和来源类型。AI 总结/推论与原文明确区分。当前确认版本不做逐句中文翻译；图表全部用英文。
- 图表按内容选择 Timeline、Tree、Comparison Table，节点可追溯到论点和证据；不做鱼骨图。
- 搜索为 PostgreSQL 全文搜索 + Qwen3.7 Text Embedding Flash 轻量向量，仅向量化摘要、关键点、证据组和标签；不向量化完整字幕。生成模型只用 DeepSeek Flash，不设备用模型。
- 默认优先低成本、云端处理和少量工具：Next.js PWA、Supabase、GitHub Actions、DeepSeek、Qwen Embedding、RSS/YouTube Data API；网页抽取尽量使用开源方案。

## 当前实现状态（以迁入的代码为准）

- 已实现 Today、Library、Detail、Sources、Settings 页面及 PWA 外壳；本地演示模式含 3 条带论点/英文证据/分析/图表的知识卡片。
- 已登记 12 个来源；The Batch、Acquired、Hidden Brain 的首轮发现流程已做过验证。
- 已实现发现与跨平台匹配、文章正文抽取、字幕解析/证据校验、DeepSeek 接口、Qwen 768 维嵌入接口、Supabase schema/RLS/全文与混合搜索、阅读状态、GitHub Actions 定时发现。
- 设置页可查看服务状态；本地 `/setup` 页面可填写 Supabase、DeepSeek、DashScope、YouTube API 配置，并写入本机 `.env.local`。密钥不要发到聊天或提交 Git。
- 旧任务记录的最近一次验证：类型检查、Lint、测试和生产构建曾通过；当前新目录未安装依赖、未运行验证，也未确认本地预览服务状态。
- 代码以演示数据和真实服务接入口为主；不能把演示内容误称为真实抓取结果。尚未确认 Supabase 真实连接、迁移执行、GitHub 自动任务或生产部署已完成。

## 继续工作的顺序

1. 在当前目录恢复依赖并启动 PWA，确认首页与 `/setup` 可视运行。
2. 用户在本机页面填入外部服务密钥（不要经聊天提供）；再安全验证 Supabase、DeepSeek、DashScope 和 YouTube API。
3. 执行 Supabase migration，跑通一条真实发现→原文/字幕验证→证据分析→保存→展示的流程。
4. 再接 GitHub Actions 定时运行并完善其余来源；每个来源单独核实发现和文字稿质量。

## 主要文件

- `README.md`：运行、服务配置、数据库迁移与来源阶段说明。
- `.env.example`：环境变量模板；勿填写真实密钥后提交。
- `src/lib/sources.ts`、`src/lib/discovery.ts`：来源与发现。
- `src/lib/transcript.ts`、`src/lib/article.ts`、`src/lib/evidence.ts`、`src/lib/pipeline.ts`：原文、字幕和证据链。
- `src/lib/deepseek.ts`、`src/lib/qwen.ts`、`src/lib/search.ts`：模型与搜索。
- `supabase/migrations/202609180001_initial_schema.sql`：数据库/RLS/搜索定义。
- `.github/workflows/discover.yml`：定时发现工作流。
