import { createPublicSupabaseClient } from "./supabase";
import type { KnowledgeItem } from "./types";

type Row = Record<string, any>;

const SELECT = "id,title,source_id,kind,status,published_at,canonical_url,summary_zh,unavailable_reason_zh,tags,people,companies,terms,sources(name),platform_versions(platform,url,duration_seconds,published_at,match_status),transcript_sources(source_kind,label,platform,url,has_timestamps,verified,selected),claims(id,claim_code,position,title_zh,information_type,assessment_zh,evidence(id,evidence_code,relation,locator,speaker,source_kind,quote)),analyses(why_zh,horizontal_zh,cross_disciplinary_zh,application_zh,personal_zh,memory_zh),visuals(timeline,tree,comparison)";

function list(value: unknown): Row[] {
  return Array.isArray(value) ? value as Row[] : value ? [value as Row] : [];
}

function mapItem(row: Row): KnowledgeItem {
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
      })),
    }));
  const analysis = list(row.analyses)[0];
  const visuals = list(row.visuals)[0];
  const transcript = list(row.transcript_sources).find((source) => source.selected) ?? list(row.transcript_sources)[0];
  const source = list(row.sources)[0];

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
    tags: Array.isArray(row.tags) ? row.tags : [],
    people: Array.isArray(row.people) ? row.people : [],
    companies: Array.isArray(row.companies) ? row.companies : [],
    terms: Array.isArray(row.terms) ? row.terms : [],
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
  };
}

export async function loadLiveItems() {
  const client = createPublicSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) return { signedIn: false, items: [] as KnowledgeItem[] };
  const { data, error } = await client.from("knowledge_items").select(SELECT).order("published_at", { ascending: false });
  if (error) throw error;
  return { signedIn: true, items: list(data).map(mapItem) };
}
