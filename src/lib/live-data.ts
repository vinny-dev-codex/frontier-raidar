import { getPublicEnv } from "./env";
import { createPublicSupabaseClient } from "./supabase";
import type { Claim, EnglishLocalization, Evidence, KnowledgeItem, PlatformVersion, TranscriptSource } from "./types";

type EvidenceRow = {
  evidence_code: string;
  relation: Evidence["relation"];
  locator: string;
  speaker: string;
  source_kind: Evidence["sourceKind"];
  quote: string;
  evidence_translations?: EvidenceTranslationRow | EvidenceTranslationRow[] | null;
};

type EvidenceTranslationRow = { translation_zh?: string | null };

type ClaimRow = {
  id: string;
  claim_code: string;
  position: number;
  title_zh: string;
  information_type: Claim["informationType"];
  assessment_zh: string;
  evidence?: EvidenceRow | EvidenceRow[] | null;
};

type PlatformVersionRow = {
  platform: string;
  url: string;
  duration_seconds?: number | null;
  published_at?: string | null;
  match_status: PlatformVersion["matchStatus"];
};

type TranscriptSourceRow = {
  source_kind: TranscriptSource["kind"];
  label: string;
  platform: string;
  url: string;
  has_timestamps: boolean;
  verified: boolean;
  selected: boolean;
};

type SourceRow = { name: string };

type AnalysisRow = {
  why_zh: string[];
  horizontal_zh: string[];
  cross_disciplinary_zh: string[];
  application_zh: string[];
  personal_zh: string[];
  memory_zh: NonNullable<KnowledgeItem["analysis"]>["memoryZh"];
};

type VisualsRow = NonNullable<KnowledgeItem["visuals"]>;
type LocalizationRow = { locale: string; content: EnglishLocalization };

type ItemRow = {
  id: string;
  title: string;
  source_id: string;
  kind: KnowledgeItem["kind"];
  status: KnowledgeItem["status"];
  published_at?: string | null;
  canonical_url: string;
  summary_zh?: string | null;
  unavailable_reason_zh?: string | null;
  tags?: string[] | null;
  people?: string[] | null;
  companies?: string[] | null;
  terms?: KnowledgeItem["terms"] | null;
  sources?: SourceRow | SourceRow[] | null;
  platform_versions?: PlatformVersionRow | PlatformVersionRow[] | null;
  transcript_sources?: TranscriptSourceRow | TranscriptSourceRow[] | null;
  claims?: ClaimRow | ClaimRow[] | null;
  analyses?: AnalysisRow | AnalysisRow[] | null;
  visuals?: VisualsRow | VisualsRow[] | null;
  knowledge_item_localizations?: LocalizationRow | LocalizationRow[] | null;
};

const SELECT = "id,title,source_id,kind,status,published_at,canonical_url,summary_zh,unavailable_reason_zh,tags,people,companies,terms,sources(name),platform_versions(platform,url,duration_seconds,published_at,match_status),transcript_sources(source_kind,label,platform,url,has_timestamps,verified,selected),claims(id,claim_code,position,title_zh,information_type,assessment_zh,evidence(id,evidence_code,relation,locator,speaker,source_kind,quote,evidence_translations(translation_zh))),analyses(why_zh,horizontal_zh,cross_disciplinary_zh,application_zh,personal_zh,memory_zh),visuals(timeline,tree,comparison),knowledge_item_localizations(locale,content)";

function list<T>(value: T | T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function mapItem(row: ItemRow): KnowledgeItem {
  const claims = list(row.claims)
    .sort((a, b) => a.position - b.position)
    .map((claim) => ({
      id: claim.claim_code,
      titleZh: claim.title_zh,
      informationType: claim.information_type,
      assessmentZh: claim.assessment_zh,
      evidence: list(claim.evidence).map((evidence) => ({
        id: evidence.evidence_code,
        relation: evidence.relation,
        locator: evidence.locator,
        speaker: evidence.speaker,
        sourceKind: evidence.source_kind,
        quote: evidence.quote,
        translationZh: list(evidence.evidence_translations)[0]?.translation_zh ?? undefined,
      })),
    }));
  const analysis = list(row.analyses)[0];
  const visuals = list(row.visuals)[0];
  const transcriptSources = list(row.transcript_sources);
  const transcript = transcriptSources.find((source) => source.selected) ?? transcriptSources[0];
  const source = list(row.sources)[0];
  const english = list(row.knowledge_item_localizations).find((localization) => localization.locale === "en")?.content;

  return {
    id: row.id,
    title: row.title,
    sourceId: row.source_id,
    sourceName: source?.name ?? row.source_id,
    kind: row.kind,
    status: row.status,
    publishedAt: row.published_at?.slice(0, 10) ?? "—",
    canonicalUrl: row.canonical_url,
    summaryZh: row.summary_zh ?? undefined,
    unavailableReasonZh: row.unavailable_reason_zh ?? undefined,
    tags: row.tags ?? [],
    people: row.people ?? [],
    companies: row.companies ?? [],
    terms: row.terms ?? [],
    platformVersions: list(row.platform_versions).map((version) => ({
      platform: version.platform,
      url: version.url,
      durationSeconds: version.duration_seconds ?? undefined,
      publishedAt: version.published_at ?? undefined,
      matchStatus: version.match_status,
    })),
    transcriptSource: transcript ? {
      kind: transcript.source_kind,
      label: transcript.label,
      platform: transcript.platform,
      url: transcript.url,
      hasTimestamps: transcript.has_timestamps,
      verified: transcript.verified,
    } : undefined,
    claims: claims.length ? claims : undefined,
    analysis: analysis ? {
      whyZh: analysis.why_zh,
      horizontalZh: analysis.horizontal_zh,
      crossDisciplinaryZh: analysis.cross_disciplinary_zh,
      applicationZh: analysis.application_zh,
      personalZh: analysis.personal_zh,
      memoryZh: analysis.memory_zh,
    } : undefined,
    visuals: visuals ? {
      timeline: visuals.timeline,
      tree: visuals.tree,
      comparison: visuals.comparison,
    } : undefined,
    english,
  };
}

export async function loadLiveItems() {
  const { NEXT_PUBLIC_LIBRARY_API_URL } = getPublicEnv();
  if (NEXT_PUBLIC_LIBRARY_API_URL) {
    const response = await fetch(NEXT_PUBLIC_LIBRARY_API_URL);
    if (!response.ok) throw new Error("The library API request failed.");
    return list<ItemRow>(await response.json() as ItemRow[]).map(mapItem);
  }

  const client = createPublicSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client.from("knowledge_items").select(SELECT).order("published_at", { ascending: false });
  if (error) throw error;
  return list<ItemRow>(data).map(mapItem);
}
