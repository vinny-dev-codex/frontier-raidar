# Frontier Radar

面向个人学习的低成本前沿信息库。它从 12 个权威来源发现文章、访谈和播客，跨平台合并同一内容，并且只在取得可验证原文、字幕或文稿后生成中文摘要、关键论点、英文原文证据、拓展分析和中文图表结构。

## 当前状态

这是可直接验收的本地完整版，并保留真实服务接入口：

- 已完成 Today、Library、Detail、Sources、Settings 五个页面和 PWA 外壳。
- 未配置密钥时使用明确标记的本地演示模式，能够搜索、筛选、收藏、标记已读、导出阅读状态。
- 每条知识卡片提供关键论点、英文证据、中文分析、中文可视化结构和原始资源的一键链接。
- 已登记 12 个来源。
- 首轮发现已接入 The Batch、Acquired、Hidden Brain。
- 已实现跨平台匹配评分、证据片段校验、DeepSeek 提取接口和 Qwen 768 维嵌入接口。
- 已提供 Supabase 数据库、来源种子数据、阅读状态、行级权限和全文/向量混合搜索迁移。
- 页面中的示例内容均明确标记为 Prototype Demonstration，并非真实抓取结果。

## 最小流程

1. Discover：RSS 或官方网站只发现元数据和平台版本。
2. Verify：按 OS → CC → RSS → PLT → EXT 顺序寻找可验证字幕；文章只接受官方正文或官方 RSS 正文。
3. Extract：DeepSeek 只返回论点和字幕片段 ID；程序再从原文精确复制引文，防止模型改写。
4. Store/Search：仅保存摘要、论点、相关证据和分析；全文搜索覆盖所有保存文本，Qwen 只嵌入摘要、论点、证据组和标签。

没有字幕或正文时只保留标题和状态，不生成内容。系统设计的重试节奏是 24 小时、72 小时、7 天，之后每周检查。

## 本地运行

需要 Node.js 24。

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

打开 `http://localhost:3000/setup` 可以在本机页面填写 Supabase、DeepSeek、百炼和 YouTube 的连接信息。该页面仅在本地开发环境可用，提交内容只写入被 Git 忽略的 `.env.local`；重启开发服务器后生效。

打开 `http://localhost:3000`。未配置外部服务时仍可浏览演示界面和运行测试。

主要页面：

- `/`：今日优先阅读与处理队列。
- `/library`：关键词、状态、来源、主题、收藏和排序组合筛选。
- `/item/<id>`：摘要、5–10 个关键论点、精确原文证据、分析和图表。
- `/sources`：12 个来源及验证状态。
- `/settings`：服务连接、处理规则和本地阅读数据。
- `/api/health`、`/api/items`、`/api/sources`：运行状态和只读数据接口。

## 外部服务

在 `.env.local` 填写：

- Supabase：公开只读知识库、全文和向量搜索。
- DeepSeek：中文摘要、5–10 条关键论点和拓展分析。
- DashScope Qwen Embedding：轻量语义搜索，仅 768 维精选文本。
- Google Cloud YouTube Data API v3：官方频道、视频标题、发布时间与平台版本发现。

截至 2026-09-20 已按官方文档核对默认模型名：`deepseek-flash` 对应 DeepSeek-V4.1-Flash；`qwen3.7-text-embedding-flash` 支持 768 维输出。模型和价格会变化，部署前仍应查看供应商最新文档。

所有密钥只允许放在服务端环境变量或 GitHub/Vercel Secrets，不能提交到仓库。`SUPABASE_SERVICE_ROLE_KEY` 绝不能发送给浏览器。

## 数据库

在 Supabase SQL Editor 执行：

`supabase/migrations/202609180001_initial_schema.sql`

然后执行：

`supabase/migrations/202609240002_processing_controls.sql`

第二个迁移会记录每次 DeepSeek 与百炼调用的模型、时间、令牌数和结果，不保存密钥或完整文稿；它也提供 350 MiB 数据库预警阈值。默认每天最多成功处理 1 条 DeepSeek 知识卡片。失败会标记为需人工重试，只有显式设置 `FORCE_RETRY=true` 才能重试。

GitHub Actions 每天在悉尼时间早晨附近运行一次自动流程：发现第一阶段来源、验证官方正文或官方 RSS 文稿、最多制作一张知识卡片、保存中文证据翻译和搜索向量，然后公开成品。无原文不会调用模型或生成卡片；失败条目会停下并等待人工重试。

自动化需要在 GitHub 仓库 Secrets 中设置：`SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`DEEPSEEK_API_KEY`、`DASHSCOPE_API_KEY`。其余模型与基础地址可使用现有默认值；如果 Supabase 有多个用户，再设置 `OWNER_EMAIL`。这些密钥只供 GitHub Actions 使用，绝不写入代码或浏览器。

最后执行：

`supabase/migrations/202609260004_public_read_library.sql`

这条迁移仅开放已完成知识卡片及其展示所需的关联数据给匿名访客；模型用量、处理记录、搜索嵌入和所有写入权限保持私有。

最后执行：

`supabase/migrations/202609260005_cache_evidence_translations.sql`

每张卡片的全部英文证据会在制作时一次性译为中文并保存。网页只显示已保存译文，不会因访客点击而重复调用模型。

## 上线与分享

采用最小部署：Vercel 托管网站，Supabase 托管数据。任何拿到链接的人都可直接阅读，不需要登录。

1. 将仓库推送到 GitHub，并在 Vercel 导入仓库。首次可直接使用 Vercel 提供的 `*.vercel.app` 地址。
2. 在 Vercel 环境变量中填写 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
3. 执行公开读取迁移后，直接把 Vercel 网址分享给家人。

## 验证命令

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run discover
```

`npm run discover` 是只读 dry run，只把发现结果打印到终端，不会下载音视频或永久保存全文。

## 来源阶段

第一阶段：The Batch、Acquired、Hidden Brain。

第二阶段：One Useful Thing、MIT Technology Review、Bloomberg Primer、Stanford GSB View From The Top、HBR IdeaCast、Knowledge at Wharton、Lenny’s Podcast、Speaking of Psychology、Freakonomics Radio。

第二阶段不会因为“已登记”就自动宣称可用；每个入口和字幕规则必须单独验证后才进入生产抓取。
