import type { SourceDefinition } from "./types";

type SourceEntry = Omit<SourceDefinition, "enabled" | "phase">;

const entries: SourceEntry[] = [
  {
    id: "acquired", name: "Acquired", category: "公司史与战略", kinds: ["video", "podcast"], priority: 10,
    homepage: "https://www.acquired.fm/", discovery: { website: "https://www.acquired.fm/", rss: "https://feeds.transistor.fm/acquired", youtubeChannelId: "UCyFqFYfTW2VoIQKylJ04Rtw" },
    collectionOrder: ["rss", "website", "youtube"], publicationPolicy: "standard", transcriptNotes: "优先官方 RSS 文字稿和官网 Show Notes；YouTube 仅用于发现与版本核对。",
  },
  {
    id: "hidden-brain", name: "Hidden Brain", category: "心理学与决策", kinds: ["video", "podcast"], priority: 1,
    homepage: "https://www.hiddenbrain.org/", discovery: { website: "https://www.hiddenbrain.org/", rss: "https://feeds.simplecast.com/kwWc0lhf", youtubeChannelId: "UCgjZeiV0Ks3Shx8xPgvm7pQ" },
    collectionOrder: ["rss", "website", "youtube"], publicationPolicy: "standard", transcriptNotes: "优先官方节目页和 Podcast 文字稿；心理学结论保留研究限定。",
  },
  {
    id: "huberman-lab", name: "Huberman Lab", category: "神经科学与健康", kinds: ["video", "podcast"], priority: 2,
    homepage: "https://www.hubermanlab.com/", discovery: { website: "https://www.hubermanlab.com/", youtubeChannelId: "UC2D2CMWXMOVWx7giW1n3LIg" },
    collectionOrder: ["website", "youtube"], publicationPolicy: "standard", transcriptNotes: "高优先级来源；优先官网文字稿或公开视频已有字幕，按标准流程直接发布。",
  },
  {
    id: "lennys-podcast", name: "Lenny's Podcast", category: "产品与增长", kinds: ["video", "podcast"], priority: 3,
    homepage: "https://www.lennyspodcast.com/", discovery: { website: "https://www.lennyspodcast.com/", youtubeChannelId: "UC6t1O76G0jYXOAoYCm153dA" },
    collectionOrder: ["website", "youtube"], publicationPolicy: "standard", transcriptNotes: "优先官方节目页和已有文字稿；抽取框架、实例与可验证指标。",
  },
  {
    id: "freakonomics-radio", name: "Freakonomics Radio Network", category: "行为经济与公共政策", kinds: ["video", "podcast"], priority: 4,
    homepage: "https://freakonomics.com/", discovery: { website: "https://freakonomics.com/", youtubeChannelId: "UCXjf7anLJA4NqUv8kPFIJWA" },
    collectionOrder: ["website", "youtube"], publicationPolicy: "standard", transcriptNotes: "优先官方节目文稿，视频仅作发现和版本补充。",
  },
  {
    id: "dwarkesh-patel", name: "Dwarkesh Patel", category: "AI 前沿访谈", kinds: ["video", "podcast"], priority: 5,
    homepage: "https://www.dwarkesh.com/", discovery: { website: "https://www.dwarkesh.com/", youtubeChannelId: "UCXl4i9dYBrFOabk0xGmbkRA" },
    collectionOrder: ["website", "youtube"], publicationPolicy: "standard", transcriptNotes: "优先官网完整文字稿；YouTube 用于发布时间和视频版本核对。",
  },
  {
    id: "stanford-hai", name: "Stanford HAI", category: "AI 研究与治理", kinds: ["video"], priority: 6,
    homepage: "https://hai.stanford.edu/", discovery: { website: "https://hai.stanford.edu/", youtubeChannelId: "UChugFTK0KyrES9terTid8vA" },
    collectionOrder: ["website", "youtube"], publicationPolicy: "standard", transcriptNotes: "优先机构原始材料、论文和完整活动视频。",
  },
  {
    id: "google-deepmind", name: "Google DeepMind", category: "AI 研究", kinds: ["video"], priority: 7,
    homepage: "https://deepmind.google/", discovery: { website: "https://deepmind.google/", youtubeChannelId: "UCP7jMXSY2xbc3KCAE0MHQ-A" },
    collectionOrder: ["website", "youtube"], publicationPolicy: "standard", transcriptNotes: "优先研究页面和完整长视频，关键结论回链论文或模型卡。",
  },
  {
    id: "stanford-gsb", name: "Stanford Graduate School of Business", category: "管理与组织", kinds: ["video"], priority: 8,
    homepage: "https://www.gsb.stanford.edu/", discovery: { website: "https://www.gsb.stanford.edu/", youtubeChannelId: "UCGwuxdEeCf0TIA2RbPOj-8g" },
    collectionOrder: ["website", "youtube"], publicationPolicy: "standard", transcriptNotes: "优先官方讲座、访谈与研究页面。",
  },
  {
    id: "y-combinator", name: "Y Combinator", category: "创业与产品", kinds: ["video"], priority: 9,
    homepage: "https://www.ycombinator.com/library", discovery: { website: "https://www.ycombinator.com/library", youtubeChannelId: "UCcefcZRL2oaA_uBNeo5UOWg" },
    collectionOrder: ["website", "youtube"], publicationPolicy: "standard", transcriptNotes: "排除活动宣传，优先创始人访谈、课程和官方资料。",
  },
  {
    id: "no-priors", name: "No Priors", category: "AI 创业与模型", kinds: ["video", "podcast"], priority: 11,
    homepage: "https://www.youtube.com/channel/UCSI7h9hydQ40K5MJHnCrQvw", discovery: { youtubeChannelId: "UCSI7h9hydQ40K5MJHnCrQvw" },
    collectionOrder: ["youtube"], publicationPolicy: "standard", transcriptNotes: "保留嘉宾、公司、观点属性和关键论点。",
  },
  {
    id: "harvard-business-review", name: "Harvard Business Review", category: "管理与战略", kinds: ["video", "article"], priority: 12,
    homepage: "https://hbr.org/", discovery: { website: "https://hbr.org/", youtubeChannelId: "UCWo4IA01TXzBeGJJKWHOG9g" },
    collectionOrder: ["website", "youtube"], publicationPolicy: "standard", transcriptNotes: "优先官方文章和节目页；不绕过付费墙。",
  },
  {
    id: "knowledge-project", name: "The Knowledge Project", category: "决策与领导力", kinds: ["video", "podcast"], priority: 13,
    homepage: "https://fs.blog/knowledge-project-podcast/", discovery: { website: "https://fs.blog/knowledge-project-podcast/", youtubeChannelId: "UCLtTf_uKt0Itd0NG7txrwXA" },
    collectionOrder: ["website", "youtube"], publicationPolicy: "standard", transcriptNotes: "优先完整访谈和官方文字稿，每周最多一集。",
  },
  {
    id: "lex-fridman", name: "Lex Fridman", category: "科学技术访谈", kinds: ["video", "podcast"], priority: 14,
    homepage: "https://lexfridman.com/podcast/", discovery: { website: "https://lexfridman.com/podcast/", youtubeChannelId: "UCSHZKyawb77ixDdsGog4iWA" },
    collectionOrder: ["website", "youtube"], publicationPolicy: "standard", transcriptNotes: "只处理主题相关嘉宾，优先官方完整文字稿并先做主题门控。",
  },
  {
    id: "ai-explained", name: "AI Explained", category: "模型与行业解释", kinds: ["video"], priority: 15,
    homepage: "https://www.youtube.com/channel/UCNJ1Ymd5yFuUPtn21xtRbbw", discovery: { youtubeChannelId: "UCNJ1Ymd5yFuUPtn21xtRbbw" },
    collectionOrder: ["youtube"], publicationPolicy: "standard", transcriptNotes: "关键结论必须回链模型卡、论文或发布方原始材料。",
  },
  {
    id: "brain-inspired", name: "Brain Inspired", category: "神经科学与 AI", kinds: ["video", "podcast"], priority: 16,
    homepage: "https://www.youtube.com/channel/UCZCA4LUirmPL61KHeUC0YRQ", discovery: { youtubeChannelId: "UCZCA4LUirmPL61KHeUC0YRQ" },
    collectionOrder: ["youtube"], publicationPolicy: "standard", transcriptNotes: "优先长视频播客与官方文字稿，研究结论保留限定。",
  },
  {
    id: "radiolab", name: "Radiolab", category: "科学与社会", kinds: ["video", "podcast"], priority: 17,
    homepage: "https://radiolab.org/", discovery: { website: "https://radiolab.org/", youtubeChannelId: "UCaum_fMDGgFQCmKHUBPq_xg" },
    collectionOrder: ["website", "youtube"], publicationPolicy: "standard", transcriptNotes: "优先官方节目页和已有文稿，叙事内容与事实证据分开。",
  },
  {
    id: "big-think", name: "Big Think", category: "跨学科解释", kinds: ["video"], priority: 18,
    homepage: "https://bigthink.com/", discovery: { website: "https://bigthink.com/", youtubeChannelId: "UCvQECJukTDE2i6aCoMnS-Vg" },
    collectionOrder: ["website", "youtube"], publicationPolicy: "standard", transcriptNotes: "关键结论需回链一手研究或嘉宾原始材料。",
  },
  {
    id: "oxford-union", name: "OxfordUnion", category: "公共议题与演讲", kinds: ["video"], priority: 19,
    homepage: "https://www.youtube.com/channel/UCY7dD6waquGnKTZSumPMTlQ", discovery: { youtubeChannelId: "UCY7dD6waquGnKTZSumPMTlQ" },
    collectionOrder: ["youtube"], publicationPolicy: "standard", transcriptNotes: "优先完整演讲与访谈，保留演讲者观点属性。",
  },
  {
    id: "a16z", name: "a16z", category: "科技投资", kinds: ["video", "podcast"], priority: 20,
    homepage: "https://a16z.com/", discovery: { website: "https://a16z.com/", youtubeChannelId: "UC9cn0TuPq4dnbTY-CBsm8XA" },
    collectionOrder: ["website", "youtube"], publicationPolicy: "standard", transcriptNotes: "标注利益相关、预测和观点属性。",
  },
  {
    id: "johnathan-bi", name: "Johnathan Bi", category: "思想与哲学", kinds: ["video"], priority: 21,
    homepage: "https://www.youtube.com/channel/UCCrl9a26fDCZvofnCnA5A8g", discovery: { youtubeChannelId: "UCCrl9a26fDCZvofnCnA5A8g" },
    collectionOrder: ["youtube"], publicationPolicy: "standard", transcriptNotes: "优先完整长内容和可验证引文。",
  },
  {
    id: "cosmic-skeptic", name: "Alex O'Connor", category: "哲学", kinds: ["video"], priority: 22,
    homepage: "https://www.youtube.com/channel/UC7kIy8fZavEni8Gzl8NLjOQ", discovery: { youtubeChannelId: "UC7kIy8fZavEni8Gzl8NLjOQ" },
    collectionOrder: ["youtube"], publicationPolicy: "standard", transcriptNotes: "仅使用可验证原文，区分论证、事实和价值判断。",
  },
  {
    id: "plasticpills", name: "PlasticPills", category: "哲学与文化", kinds: ["video"], priority: 23,
    homepage: "https://www.youtube.com/channel/UC9XFvuObhfVUNAGNcH8Y_fw", discovery: { youtubeChannelId: "UC9XFvuObhfVUNAGNcH8Y_fw" },
    collectionOrder: ["youtube"], publicationPolicy: "standard", transcriptNotes: "标注解释和观点属性，关键引文回到原始文本。",
  },
  {
    id: "wayde-ai", name: "Wayde AI", category: "AI 与心理学", kinds: ["video", "podcast"], priority: 24,
    homepage: "https://www.youtube.com/channel/UC8kfx6xEt6NAvn8A9Q_wAGw", discovery: { youtubeChannelId: "UC8kfx6xEt6NAvn8A9Q_wAGw" },
    collectionOrder: ["youtube"], publicationPolicy: "standard", transcriptNotes: "优先公开视频已有字幕，按标准流程直接发布。",
  },
  {
    id: "ali-abdaal", name: "Ali Abdaal", category: "学习与生产力", kinds: ["video"], priority: 25,
    homepage: "https://www.youtube.com/channel/UCoOae5nYA7VqaXzerajD0lg", discovery: { youtubeChannelId: "UCoOae5nYA7VqaXzerajD0lg" },
    collectionOrder: ["youtube"], publicationPolicy: "standard", transcriptNotes: "区分个人经验、建议和可验证结论。",
  },
  {
    id: "school-of-hard-knocks", name: "School of Hard Knocks", category: "创业案例", kinds: ["video"], priority: 26,
    homepage: "https://www.youtube.com/channel/UCmtBqvOp6xHlecDO0Un9O4w", discovery: { youtubeChannelId: "UCmtBqvOp6xHlecDO0Un9O4w" },
    collectionOrder: ["youtube"], publicationPolicy: "standard", transcriptNotes: "标注经验叙述和样本偏差，避免泛化为事实。",
  },
  {
    id: "my-first-million", name: "My First Million", category: "商业创意", kinds: ["video", "podcast"], priority: 27,
    homepage: "https://www.youtube.com/channel/UCyaN6mg5u8Cjy2ZI4ikWaug", discovery: { youtubeChannelId: "UCyaN6mg5u8Cjy2ZI4ikWaug" },
    collectionOrder: ["youtube"], publicationPolicy: "standard", transcriptNotes: "仅作创意发现；未经独立资料支持不作为事实验证源。",
  },
  {
    id: "dan-koe", name: "Dan Koe", category: "创作与个人商业", kinds: ["video"], priority: 28,
    homepage: "https://www.youtube.com/channel/UCWXYDYv5STLk-zoxMP2I1Lw", discovery: { youtubeChannelId: "UCWXYDYv5STLk-zoxMP2I1Lw" },
    collectionOrder: ["youtube"], publicationPolicy: "standard", transcriptNotes: "标注观点和个人经验属性。",
  },
  {
    id: "erin-meryl-mcgurk", name: "erin meryl mcgurk", category: "学习与研究方法", kinds: ["video"], priority: 29,
    homepage: "https://www.youtube.com/channel/UCmC01dEB_LBMTYhSLPs1CWw", discovery: { youtubeChannelId: "UCmC01dEB_LBMTYhSLPs1CWw" },
    collectionOrder: ["youtube"], publicationPolicy: "standard", transcriptNotes: "仅使用可验证原文，个人方法不能泛化为普遍结论。",
  },
];

export const SOURCES: SourceDefinition[] = entries.toSorted((a, b) => a.priority - b.priority).map((entry) => ({
  ...entry,
  enabled: true,
  phase: entry.priority <= 10 ? 1 : 2,
}));

export function getSource(sourceId: string) {
  return SOURCES.find((source) => source.id === sourceId);
}
