export type ContentStatus =
  | "ready"
  | "no_transcript"
  | "no_article_body"
  | "pending_review"
  | "processing_failed";

export type ContentKind = "article" | "podcast" | "video";

export type TranscriptKind = "OS" | "CC" | "RSS" | "PLT" | "EXT";

export type EvidenceRelation =
  | "PRIMARY"
  | "SUP"
  | "ADD"
  | "EX"
  | "CTX"
  | "QUAL"
  | "CMP"
  | "REF"
  | "RISK"
  | "UNC";

export type PlatformVersion = {
  platform: string;
  url: string;
  durationSeconds?: number;
  publishedAt?: string;
  matchStatus: "exact" | "likely" | "edited" | "related";
};

export type TranscriptSource = {
  kind: TranscriptKind;
  label: string;
  platform: string;
  url: string;
  hasTimestamps: boolean;
  verified: boolean;
};

export type Evidence = {
  id: string;
  relation: EvidenceRelation;
  locator: string;
  speaker: string;
  sourceKind: TranscriptKind;
  quote: string;
  translationZh?: string;
};

export type Claim = {
  id: string;
  titleZh: string;
  informationType: "fact" | "opinion" | "prediction" | "advice";
  evidence: Evidence[];
  assessmentZh: string;
};

export type TimelineEvent = {
  locator: string;
  label: string;
  claimId?: string;
};

export type TreeNode = {
  label: string;
  children?: TreeNode[];
};

export type ComparisonRow = {
  question: string;
  viewA: string;
  viewB: string;
  evidenceIds: string[];
};

export type Analysis = {
  whyZh: string[];
  horizontalZh: string[];
  crossDisciplinaryZh: string[];
  applicationZh: string[];
  personalZh: string[];
  memoryZh: {
    keywords: string[];
    analogy: string;
    recallQuestion: string;
  };
};

export type EnglishLocalization = {
  summary: string;
  tags: string[];
  claims: { id: string; title: string; assessment: string }[];
  analysis: {
    why: string[];
    horizontal: string[];
    crossDisciplinary: string[];
    application: string[];
    personal: string[];
    memory: {
      keywords: string[];
      analogy: string;
      recallQuestion: string;
    };
  };
  visuals: {
    timeline: TimelineEvent[];
    tree: TreeNode;
    comparison: ComparisonRow[];
  };
};

export type KnowledgeItem = {
  id: string;
  title: string;
  sourceId: string;
  sourceName: string;
  kind: ContentKind;
  status: ContentStatus;
  publishedAt: string;
  canonicalUrl: string;
  summaryZh?: string;
  unavailableReasonZh?: string;
  tags: string[];
  people: string[];
  companies: string[];
  terms: { zh: string; en: string }[];
  platformVersions: PlatformVersion[];
  transcriptSource?: TranscriptSource;
  claims?: Claim[];
  analysis?: Analysis;
  visuals?: {
    timeline?: TimelineEvent[];
    tree?: TreeNode;
    comparison?: ComparisonRow[];
  };
  english?: EnglishLocalization;
  isDemo?: boolean;
};

export type SourceDefinition = {
  id: string;
  name: string;
  category: string;
  kinds: ContentKind[];
  priority: number;
  homepage: string;
  discovery: {
    website?: string;
    rss?: string;
    youtubeChannelId: string;
    applePodcasts?: string;
    spotify?: string;
  };
  collectionOrder: ("rss" | "website" | "youtube")[];
  publicationPolicy: "standard" | "external_corroboration_required";
  transcriptNotes: string;
  enabled: boolean;
  phase: 1 | 2;
};

export type TranscriptSegment = {
  id: string;
  text: string;
  startMs?: number;
  endMs?: number;
  speaker?: string;
  paragraph?: number;
};
