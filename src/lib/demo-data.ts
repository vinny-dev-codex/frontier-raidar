import type { KnowledgeItem } from "./types";
import { ADDITIONAL_DEMO_ITEMS } from "./additional-demo-data";

const BASE_DEMO_ITEMS: KnowledgeItem[] = [
  {
    id: "demo-ai-entry-barriers",
    title: "How AI Changes the Economics of Building Products",
    sourceId: "prototype",
    sourceName: "Prototype Demonstration",
    kind: "podcast",
    status: "ready",
    publishedAt: "2026-09-18",
    canonicalUrl: "#",
    summaryZh:
      "这条演示内容展示第一版最终格式：AI 降低了产品开发成本，但并没有自动解决获客、品牌和用户信任问题。真正需要追踪的不是单一乐观结论，而是支持、限定和反驳该结论的全部独立证据。",
    tags: ["AI创业", "产品开发", "分发", "品牌"],
    people: ["Alex Morgan", "Jordan Lee"],
    companies: ["Northstar Labs"],
    terms: [
      { zh: "进入壁垒", en: "Barriers to Entry" },
      { zh: "分发优势", en: "Distribution Advantage" },
      { zh: "产品市场匹配", en: "Product-Market Fit" },
    ],
    platformVersions: [
      {
        platform: "Podcast RSS",
        url: "#",
        durationSeconds: 3600,
        publishedAt: "2026-09-18",
        matchStatus: "exact",
      },
      {
        platform: "YouTube",
        url: "#",
        durationSeconds: 3470,
        publishedAt: "2026-09-18",
        matchStatus: "edited",
      },
    ],
    transcriptSource: {
      kind: "RSS",
      label: "Official Podcast RSS Transcript",
      platform: "Podcast RSS",
      url: "#",
      hasTimestamps: true,
      verified: true,
    },
    claims: [
      {
        id: "C01",
        titleZh: "AI 降低产品开发成本，但不会自动建立市场优势。",
        informationType: "opinion",
        assessmentZh:
          "开发成本下降获得多处证据支持，但节目同时提出竞争加剧和分发瓶颈，因此不能把“更容易开发”直接等同于“更容易成功”。",
        evidence: [
          {
            id: "P01",
            relation: "PRIMARY",
            locator: "12:44–12:51",
            speaker: "G1",
            sourceKind: "RSS",
            quote: "The cost of building software is falling rapidly.",
          },
          {
            id: "S01",
            relation: "SUP",
            locator: "12:52–13:05",
            speaker: "G1",
            sourceKind: "RSS",
            quote:
              "A small team can now produce what previously required an entire department.",
          },
          {
            id: "S02",
            relation: "ADD",
            locator: "15:20–15:34",
            speaker: "G1",
            sourceKind: "RSS",
            quote: "This changes who can enter the market, but not who can win it.",
          },
          {
            id: "S03",
            relation: "QUAL",
            locator: "26:02–26:20",
            speaker: "H",
            sourceKind: "RSS",
            quote:
              "That advantage disappears if every competitor has access to the same tools.",
          },
          {
            id: "S04",
            relation: "REF",
            locator: "31:12–31:40",
            speaker: "G2",
            sourceKind: "RSS",
            quote: "Distribution costs may also fall when AI improves targeting.",
          },
        ],
      },
      {
        id: "C02",
        titleZh: "当生产能力普及后，品牌、信任和分发会变得更加稀缺。",
        informationType: "prediction",
        assessmentZh:
          "该判断建立在供给增长快于注意力增长的假设上，适合用于观察创业机会，但仍需结合具体行业验证。",
        evidence: [
          {
            id: "P02",
            relation: "PRIMARY",
            locator: "38:10–38:28",
            speaker: "G1",
            sourceKind: "RSS",
            quote:
              "When production becomes abundant, trust and distribution become the scarce assets.",
          },
          {
            id: "S05",
            relation: "RISK",
            locator: "40:02–40:21",
            speaker: "H",
            sourceKind: "RSS",
            quote:
              "The risk is assuming that every market values trust in the same way.",
          },
        ],
      },
      {
        id: "C03",
        titleZh: "工具能力趋同时，行业理解会比单纯掌握工具更难复制。",
        informationType: "opinion",
        assessmentZh:
          "这一观点把竞争优势从工具使用转向问题选择和行业判断，但是否成立取决于工具普及速度与具体行业门槛。",
        evidence: [
          {
            id: "P03",
            relation: "PRIMARY",
            locator: "44:18–44:39",
            speaker: "G2",
            sourceKind: "RSS",
            quote:
              "The tool is available to everyone; knowing which problem is worth solving is not.",
          },
          {
            id: "S06",
            relation: "QUAL",
            locator: "45:03–45:19",
            speaker: "H",
            sourceKind: "RSS",
            quote:
              "In regulated industries, access to data and expertise can still dominate the advantage.",
          },
        ],
      },
      {
        id: "C04",
        titleZh: "快速试验的价值来自学习速度，而不是发布数量。",
        informationType: "advice",
        assessmentZh:
          "该建议强调每次试验必须回答清晰问题，否则更高的产出速度只会制造更多噪声。",
        evidence: [
          {
            id: "P04",
            relation: "PRIMARY",
            locator: "49:12–49:33",
            speaker: "G1",
            sourceKind: "RSS",
            quote:
              "The real benefit of faster building is faster learning, not a larger pile of launches.",
          },
          {
            id: "S07",
            relation: "RISK",
            locator: "50:02–50:21",
            speaker: "G1",
            sourceKind: "RSS",
            quote:
              "If the experiment has no question, speed simply produces noise more quickly.",
          },
        ],
      },
      {
        id: "C05",
        titleZh: "创始人应把节省的开发资源投入用户理解和可信分发。",
        informationType: "advice",
        assessmentZh:
          "这是从前述判断推导出的行动建议，适合作为资源分配原则，但不代表所有项目都应减少技术投入。",
        evidence: [
          {
            id: "P05",
            relation: "PRIMARY",
            locator: "53:40–54:04",
            speaker: "G2",
            sourceKind: "RSS",
            quote:
              "Spend the hours you save on understanding customers and earning a channel they trust.",
          },
          {
            id: "S08",
            relation: "UNC",
            locator: "54:10–54:27",
            speaker: "H",
            sourceKind: "RSS",
            quote:
              "We do not yet know how durable those channels will be as discovery itself becomes automated.",
          },
        ],
      },
    ],
    analysis: {
      whyZh: [
        "工具降低了产品生产所需的时间和人数，使更多参与者能够进入市场。",
        "用户的注意力没有按相同速度增长，因此竞争从“能否做出来”转向“能否被看见和被信任”。",
      ],
      horizontalZh: [
        "相似观点强调品牌和分发的重要性；相反观点认为 AI 也能降低广告制作和用户定位成本。",
      ],
      crossDisciplinaryZh: [
        "从经济学看，这是供给增加与稀缺资源转移；从心理学看，选择过多会提高信任线索的重要性。",
      ],
      applicationZh: [
        "评估创业方向时，除了产品可行性，还应单独评估用户获取、可信度和持续分发渠道。",
      ],
      personalZh: [
        "学习 AI 工具的同时，优先积累行业理解、表达能力和可重复触达用户的渠道。",
      ],
      memoryZh: {
        keywords: ["生产普及", "注意力稀缺", "信任迁移"],
        analogy: "AI 像降低了开店成本，但没有自动把顾客带进店里。",
        recallQuestion: "当人人都能快速生产产品时，下一种稀缺资源是什么？",
      },
    },
    visuals: {
      timeline: [
        { locator: "00:00", label: "Problem Definition" },
        { locator: "12:44", label: "Lower Building Cost", claimId: "C01" },
        { locator: "26:02", label: "Competitive Limitation", claimId: "C01" },
        { locator: "38:10", label: "New Scarce Assets", claimId: "C02" },
      ],
      tree: {
        label: "AI Lowers Entry Barriers",
        children: [
          {
            label: "Product Development",
            children: [{ label: "Lower Cost" }, { label: "Faster Prototyping" }],
          },
          {
            label: "Market Competition",
            children: [{ label: "More Products" }, { label: "Greater Similarity" }],
          },
          {
            label: "New Scarce Assets",
            children: [{ label: "Brand" }, { label: "Trust" }, { label: "Distribution" }],
          },
        ],
      },
      comparison: [
        {
          question: "Does AI make entrepreneurship easier?",
          viewA: "Development is easier",
          viewB: "Competition is harder",
          evidenceIds: ["P01", "S01", "S03"],
        },
        {
          question: "Will distribution remain difficult?",
          viewA: "Attention remains scarce",
          viewB: "AI may reduce targeting cost",
          evidenceIds: ["S02", "S04"],
        },
      ],
    },
    isDemo: true,
  },
  {
    id: "hidden-brain-pending-transcript",
    title: "A Newly Published Hidden Brain Episode",
    sourceId: "hidden-brain",
    sourceName: "Hidden Brain",
    kind: "podcast",
    status: "no_transcript",
    publishedAt: "2026-09-18",
    canonicalUrl: "https://www.hiddenbrain.org/",
    unavailableReasonZh:
      "已经检查官方网站、Podcast RSS、Apple Podcasts、Spotify 和其他可验证入口，暂未找到字幕或文稿。系统将在24小时、72小时和7天后重新检查。",
    tags: ["心理学", "社会"],
    people: [],
    companies: [],
    terms: [],
    platformVersions: [
      {
        platform: "Official Website",
        url: "https://www.hiddenbrain.org/",
        publishedAt: "2026-09-18",
        matchStatus: "exact",
      },
    ],
    isDemo: true,
  },
  {
    id: "the-batch-awaiting-body",
    title: "A Newly Discovered Issue of The Batch",
    sourceId: "the-batch",
    sourceName: "The Batch",
    kind: "article",
    status: "no_article_body",
    publishedAt: "2026-09-18",
    canonicalUrl: "https://www.deeplearning.ai/the-batch",
    unavailableReasonZh:
      "已经发现标题，但暂未取得官方文章正文，因此不生成摘要、关键点、分析或图表。",
    tags: ["AI", "Technology"],
    people: [],
    companies: ["DeepLearning.AI"],
    terms: [{ zh: "人工智能", en: "Artificial Intelligence" }],
    platformVersions: [
      {
        platform: "Official Website",
        url: "https://www.deeplearning.ai/the-batch",
        publishedAt: "2026-09-18",
        matchStatus: "exact",
      },
    ],
    isDemo: true,
  },
];

export const DEMO_ITEMS: KnowledgeItem[] = [
  BASE_DEMO_ITEMS[0]!,
  ...ADDITIONAL_DEMO_ITEMS,
  ...BASE_DEMO_ITEMS.slice(1),
];

export function getKnowledgeItem(itemId: string) {
  return DEMO_ITEMS.find((item) => item.id === itemId);
}
