# Frontier Radar

面向个人学习的低成本前沿信息库。它从 29 个正式来源发现文章、访谈和播客，并且只在取得可验证原文、字幕或文稿后生成中文摘要、关键论点、英文原文与中文译文证据、拓展分析和中文图表结构。

## 当前状态

这是可直接验收的本地完整版，并保留真实服务接入口：

- 已完成 Today、Library、Detail、Sources、Settings 五个页面和 PWA 外壳。
- 未配置密钥时使用明确标记的本地演示模式，能够搜索、筛选、收藏、标记已读、导出阅读状态。
- 每条知识卡片提供关键论点、英文证据、中文分析、中文可视化结构和原始资源的一键链接。
- 29 个来源均已绑定唯一官方 YouTube 频道 ID；来源文档仅作为频道索引，实际采集优先官网、RSS 和已有文字材料。
- Huberman Lab 位列第 2 优先级；Huberman Lab 与 Wayde AI 均按标准流程直接发布，不设置额外数据门禁。Acquired 已下调到第 10。
- CloudBase 国内读取路径已由用户及其家人在中国大陆验证可访问，并已正式合并到主分支。
- 已实现跨平台匹配评分、证据片段校验、DeepSeek 提取接口和 Qwen 768 维嵌入接口。
- 已提供 Supabase 数据库、来源种子数据、阅读状态、行级权限和全文/向量混合搜索迁移。
- 页面中的示例内容均明确标记为 Prototype Demonstration，并非真实抓取结果。

## 最小流程

1. Discover：RSS 或官方网站只发现元数据和平台版本。
2. Verify：只接受官方正文、官方文字稿、发布者 RSS 文稿、创作者字幕或 YouTube 已存在的平台字幕；文章只接受官方正文或官方 RSS 正文。最终规则明确禁止下载音频或自行语音转录。
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
- `/sources`：29 个来源、采集顺序、优先级和发布门禁。
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

第二个迁移会记录每次 DeepSeek 与百炼调用的模型、时间、令牌数和结果，不保存密钥或完整文稿；它也提供 350 MiB 数据库预警阈值。默认每天最多成功处理 5 条知识卡片，不以填满额度为目标。失败会标记为需人工重试，只有显式设置 `FORCE_RETRY=true` 才能重试。

Windows 本地计划任务每天按悉尼本地时间运行生产流程：同步来源配置，按优先级发现全部 29 个来源，验证官方正文、已有文稿或公开视频现成字幕，每个悉尼自然日最多制作 5 张知识卡片（可少不可多），保存中文证据翻译和搜索向量，然后直接公开成品。轮询时同一轮每个来源最多取一条，优先形成多来源批次。无可验证文本不会调用模型或生成卡片；失败条目会停下并等待人工重试。运行入口是 `scripts/run-local-automation.ps1`，日志保留 30 天并写入 `E:\AI\Codex\FrontierRadar\logs`。

本地生产自动化从未提交的 `.env.local` 读取凭据。GitHub 仓库 Secrets 继续用于云端预检与容量审计；GitHub Actions 负责类型检查、测试、Lint 和额度健康检查，不再从托管数据中心执行注定拿不到 YouTube 字幕的生产制卡。`OWNER_EMAIL` 只用于多用户数据库中定位内容所有者，不用于通知。

最后执行：

`supabase/migrations/202609260004_public_read_library.sql`

这条迁移仅开放已完成知识卡片及其展示所需的关联数据给匿名访客；模型用量、处理记录、搜索嵌入和所有写入权限保持私有。

最后执行：

`supabase/migrations/202609260005_cache_evidence_translations.sql`

每张卡片的全部英文证据会在制作时一次性译为中文并保存。网页只显示已保存译文，不会因访客点击而重复调用模型。

最后执行：

`supabase/migrations/202609270006_switch_to_29_sources.sql`

这条迁移会停用旧来源、启用带固定优先级和官方频道 ID 的 29 个正式来源，并删除旧的邮件投递表。最终决定是不发送邮件通知。

## 上线与分享

采用最小部署：Vercel 托管网站，Supabase 托管数据。任何拿到链接的人都可直接阅读，不需要登录。

1. 将仓库推送到 GitHub，并在 Vercel 导入仓库。首次可直接使用 Vercel 提供的 `*.vercel.app` 地址。
2. 在 Vercel 环境变量中填写 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
3. 执行公开读取迁移后，直接把 Vercel 网址分享给家人。

### 中国大陆访问（CloudBase）

仓库提供一条与 Vercel 隔离的 CloudBase 路径：静态网页通过 CloudBase 云函数读取现有 Supabase 公开知识库，浏览器不会直连 Supabase。该路径已经过中国大陆实机访问确认。完整部署、密钥边界、验收和回退说明见 [CloudBase 国内访问说明](docs/cloudbase-domestic-test.md)。

## 验证命令

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run discover
```

`npm run discover` 是只读 dry run，只把发现结果打印到终端，不会下载音视频或永久保存全文。

## 来源优先级

前十名依次为：Hidden Brain、Huberman Lab、Lenny's Podcast、Freakonomics Radio Network、Dwarkesh Patel、Stanford HAI、Google DeepMind、Stanford GSB、Y Combinator、Acquired。其余 19 个来源继续按 `src/lib/sources.ts` 中的明确序号轮询。

29 个频道全部启用。来源审计会检查每个频道最近 10 条内容的时长和现成字幕。截至 2026-09-27，本机网络审计为 29/29 均至少有一条符合自动制作条件；GitHub 托管运行器的两次审计均为 0/29，因为其数据中心网络拿不到 YouTube 公开字幕轨。因此生产制卡改由本地计划任务执行，GitHub Actions 只做云端健康检查。任何路径都不得用音频转录补缺。
