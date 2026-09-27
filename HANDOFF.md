# Frontier Radar 项目续接说明

## 当前目标

维护一个供个人学习使用的低成本前沿信息 PWA：从正式来源发现内容，只在取得可验证文字材料后制作可追溯的中文知识卡片，并通过 Vercel 或 CloudBase 供家人只读访问。

## 已确认且不可再沿用旧说法的决定

- 正式来源已经从旧的 12 个切换为 29 个；用户提供的 DOCX 只作为频道索引，实际采集应选择可靠、高效的官网、RSS、官方文字稿或可验证字幕。
- 29 个来源均已绑定唯一官方 YouTube 频道 ID，避免按名称搜索导致串台。
- 来源按 1–29 严格排序。前十名是 Hidden Brain、Huberman Lab、Lenny's Podcast、Freakonomics Radio Network、Dwarkesh Patel、Stanford HAI、Google DeepMind、Stanford GSB、Y Combinator、Acquired。
- Huberman Lab 位列第 2，Acquired 下调到第 10；Huberman Lab 与 Wayde AI 均按标准流程直接发布，不设置额外数据门禁。
- 每个 UTC 日最多制作 5 张卡片，可少不可多。代码把环境变量限制在最多 5，不能由部署配置调高。
- 文字材料只接受官方正文、官方文字稿、发布者 RSS 文稿或可验证字幕。最终决定明确禁止音频转录。
- 中文证据翻译继续保留；DeepSeek 负责提取和翻译，Qwen Embedding 继续负责 768 维精选文本向量。
- 最终决定是不发送邮件通知。`OWNER_EMAIL` 只用于多用户 Supabase 中定位内容所有者；新迁移会删除旧的邮件投递表。
- CloudBase 路径已由用户及其家人在中国大陆验证可访问，分支已经正式合并到 `main`。Vercel 路径继续保留，两者共用 Supabase 公开成品库。

## 当前实现状态

- `main` 已包含 29 来源工作流和 CloudBase 国内访问实现。
- `src/lib/sources.ts` 是来源、优先级、固定频道 ID、采集顺序和发布门禁的唯一代码事实来源。
- `src/lib/workflow-policy.ts` 锁定每日上限 5、禁音频转录、禁邮件投递。
- GitHub Actions 已改用 `--env-file-if-exists=.env.local`，避免 CI 因不存在本机文件而启动失败；运行前会检查五个必需变量，并传入 `YOUTUBE_API_KEY`。
- 自动发现会遍历全部 29 个启用来源并按优先级轮询；同一轮每个来源最多取一条，避免一天五张全部来自同一频道。
- 无可验证文字材料时不调用模型，也不为了填满 5 张而降低标准。
- 页面显示 29 个来源及其采集顺序。全部来源通过原文证据校验后直接发布。
- CloudBase 静态导出通过只读云函数访问 Supabase；浏览器不持有 Supabase 地址或密钥。
- 最近一次本地验证：类型检查通过，22 项测试通过，Lint 通过，Next.js 生产构建通过。

## 数据库与运行态待核对

- 新迁移：`supabase/migrations/202609270007_rebalance_sources.sql`。它调整优先级并移除 Huberman Lab 与 Wayde AI 的旧发布门禁。
- 旧库中曾有两条 The Batch 半成品和一条悬空 Acquired 处理记录。执行删除前必须先备份到 `E:\AI\Codex\FrontierRadar\backups`，然后按已核对的精确 ID 清理，不能模糊删除。
- GitHub 仓库 Secrets 必须包含 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`DEEPSEEK_API_KEY`、`DASHSCOPE_API_KEY`、`YOUTUBE_API_KEY`。推送后应手动运行一次 Actions 并检查预检和自动化日志。

## 关键文件

- `src/lib/sources.ts`：29 来源、排序、频道 ID 和发布策略。
- `src/lib/workflow-policy.ts`：最终工作流限制。
- `src/lib/discovery.ts`：RSS 与固定 YouTube 频道发现。
- `src/lib/automation.ts`：每日配额、轮询、卡片制作和发布门禁。
- `.github/workflows/discover.yml`、`scripts/check-automation-env.ts`：GitHub Actions 与 Secrets 预检。
- `supabase/migrations/202609270006_switch_to_29_sources.sql`：数据库来源切换与禁邮件落地。
- `cloudbase/`、`docs/cloudbase-domestic-test.md`：国内只读部署路径。
