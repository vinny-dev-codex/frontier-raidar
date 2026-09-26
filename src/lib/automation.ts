import { fetchOfficialArticle } from "./article";
import { ModelResponseError } from "./deepseek";
import { discoverSource, type DiscoveredEntry } from "./discovery";
import { getPrivateEnv } from "./env";
import { buildKnowledgeDraft, createSearchDocuments } from "./pipeline";
import { createSearchEmbedding } from "./qwen";
import { SOURCES } from "./sources";
import { createServiceSupabaseClient } from "./supabase";
import { fetchTranscriptTemporarily } from "./transcript";
import { translateEvidenceBatchToChinese } from "./translation";
import type { ContentKind, Evidence, SourceDefinition, TranscriptSegment, TranscriptSource } from "./types";

type Candidate = {
  entry: DiscoveredEntry;
  source: SourceDefinition;
  kind: ContentKind;
  transcriptSource: TranscriptSource;
  segments: TranscriptSegment[];
};

type UsageEvent = {
  provider: "deepseek" | "dashscope";
  model: string;
  operation: string;
  status: "succeeded" | "failed";
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  itemId?: string | null;
  errorSummary?: string | null;
};

function failureMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : "Unknown processing error";
}

async function resolveOwnerId(database: NonNullable<ReturnType<typeof createServiceSupabaseClient>>) {
  const env = getPrivateEnv();
  const { data, error } = await database.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (error) throw error;

  const owner = env.OWNER_EMAIL
    ? data.users.find((user) => user.email?.toLowerCase() === env.OWNER_EMAIL?.toLowerCase())
    : data.users.length === 1 ? data.users[0] : undefined;
  if (!owner) throw new Error("Set OWNER_EMAIL in GitHub Secrets when the Supabase project has more than one user.");
  return owner.id;
}

async function canProcessToday(database: NonNullable<ReturnType<typeof createServiceSupabaseClient>>, userId: string) {
  const { data: quota, error: quotaError } = await database.rpc("database_quota_status");
  if (quotaError) throw quotaError;
  const quotaStatus = Array.isArray(quota) ? quota[0] : quota;
  if (quotaStatus?.warning) {
    throw new Error(`Supabase database warning threshold reached (${quotaStatus.database_bytes} bytes).`);
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const dailyLimit = Number.parseInt(process.env.DAILY_PROCESS_LIMIT ?? "1", 10);
  const { count, error } = await database
    .from("model_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("provider", "deepseek")
    .eq("operation", "knowledge_extraction")
    .eq("status", "succeeded")
    .gte("created_at", startOfDay.toISOString());
  if (error) throw error;
  return { allowed: (count ?? 0) < dailyLimit, processedToday: count ?? 0, dailyLimit };
}

async function prepareCandidate(entry: DiscoveredEntry, source: SourceDefinition): Promise<Candidate | undefined> {
  if (entry.transcriptUrls.length > 0) {
    const transcriptSource: TranscriptSource = {
      kind: "RSS",
      label: `${source.name} official Podcast RSS transcript`,
      platform: entry.platform,
      url: entry.transcriptUrls[0],
      hasTimestamps: entry.transcriptUrls[0].toLowerCase().includes(".vtt"),
      verified: true,
    };
    const segments = await fetchTranscriptTemporarily(transcriptSource);
    if (segments.length === 0) return undefined;
    return { entry, source, kind: "podcast", transcriptSource, segments };
  }

  if (entry.platform === "Official Website" && source.kinds.includes("article")) {
    const segments = await fetchOfficialArticle(entry.canonicalUrl, source.homepage);
    if (segments.length === 0) return undefined;
    return {
      entry,
      source,
      kind: "article",
      transcriptSource: {
        kind: "OS",
        label: `${source.name} official article body`,
        platform: "Official Website",
        url: entry.canonicalUrl,
        hasTimestamps: false,
        verified: true,
      },
      segments,
    };
  }

  return undefined;
}

async function isAlreadyHandled(
  database: NonNullable<ReturnType<typeof createServiceSupabaseClient>>,
  userId: string,
  entry: DiscoveredEntry,
) {
  const { data: item, error } = await database
    .from("knowledge_items")
    .select("id, status")
    .eq("user_id", userId)
    .eq("source_id", entry.sourceId)
    .eq("external_id", entry.externalId)
    .maybeSingle();
  if (error) throw error;
  if (item?.status === "ready") return true;

  const { data: attempt, error: attemptError } = await database
    .from("processing_attempts")
    .select("status")
    .eq("user_id", userId)
    .eq("source_id", entry.sourceId)
    .eq("external_id", entry.externalId)
    .maybeSingle();
  if (attemptError) throw attemptError;
  return attempt?.status === "failed" && process.env.FORCE_RETRY !== "true";
}

async function processCandidate(
  database: NonNullable<ReturnType<typeof createServiceSupabaseClient>>,
  userId: string,
  candidate: Candidate,
) {
  const { entry, source, kind, transcriptSource, segments } = candidate;
  const { data: attempt, error: attemptError } = await database
    .from("processing_attempts")
    .upsert({
      user_id: userId,
      source_id: entry.sourceId,
      external_id: entry.externalId,
      status: "processing",
      manual_retry_required: false,
      error_summary: null,
    }, { onConflict: "user_id,source_id,external_id" })
    .select("id")
    .single();
  if (attemptError) throw attemptError;

  const recordUsage = async (event: UsageEvent) => {
    const { error } = await database.from("model_usage_events").insert({
      user_id: userId,
      attempt_id: attempt.id,
      item_id: event.itemId ?? null,
      provider: event.provider,
      model: event.model,
      operation: event.operation,
      status: event.status,
      prompt_tokens: event.promptTokens ?? null,
      completion_tokens: event.completionTokens ?? null,
      total_tokens: event.totalTokens ?? null,
      error_summary: event.errorSummary ?? null,
    });
    if (error) throw error;
  };

  let itemId: string | undefined;
  try {
    let draft: Awaited<ReturnType<typeof buildKnowledgeDraft>>;
    try {
      draft = await buildKnowledgeDraft({ title: entry.title, sourceName: source.name, sourceKind: transcriptSource.kind, segments });
    } catch (error) {
      const usage = error instanceof ModelResponseError ? error.usage : undefined;
      await recordUsage({
        provider: "deepseek",
        model: getPrivateEnv().DEEPSEEK_MODEL,
        operation: "knowledge_extraction",
        status: "failed",
        promptTokens: usage?.promptTokens,
        completionTokens: usage?.completionTokens,
        totalTokens: usage?.totalTokens,
        errorSummary: failureMessage(error),
      });
      throw error;
    }
    await recordUsage({
      provider: "deepseek",
      model: draft.model,
      operation: "knowledge_extraction",
      status: "succeeded",
      promptTokens: draft.modelUsage.promptTokens,
      completionTokens: draft.modelUsage.completionTokens,
      totalTokens: draft.modelUsage.totalTokens,
    });

    const { data: item, error: itemError } = await database
      .from("knowledge_items")
      .upsert({
        user_id: userId,
        source_id: entry.sourceId,
        external_id: entry.externalId,
        title: entry.title,
        canonical_url: entry.canonicalUrl,
        kind,
        status: "pending_review",
        published_at: entry.publishedAt ?? null,
        summary_zh: draft.summaryZh,
        unavailable_reason_zh: null,
        tags: draft.tags,
        people: draft.people,
        companies: draft.companies,
        terms: draft.terms,
        retry_count: 0,
        next_transcript_check_at: null,
      }, { onConflict: "user_id,source_id,external_id" })
      .select("id")
      .single();
    if (itemError) throw itemError;
    itemId = item.id;

    const cleanup = await Promise.all([
      database.from("search_documents").delete().eq("item_id", itemId),
      database.from("visuals").delete().eq("item_id", itemId),
      database.from("analyses").delete().eq("item_id", itemId),
      database.from("claims").delete().eq("item_id", itemId),
      database.from("transcript_sources").delete().eq("item_id", itemId),
      database.from("platform_versions").delete().eq("item_id", itemId),
    ]);
    for (const result of cleanup) if (result.error) throw result.error;

    const { error: versionError } = await database.from("platform_versions").insert({
      item_id: itemId,
      platform: entry.platform,
      url: entry.canonicalUrl,
      duration_seconds: entry.durationSeconds ?? null,
      published_at: entry.publishedAt ?? null,
      match_score: 1,
      match_status: "exact",
    });
    if (versionError) throw versionError;

    const { error: transcriptError } = await database.from("transcript_sources").insert({
      item_id: itemId,
      source_kind: transcriptSource.kind,
      label: transcriptSource.label,
      platform: transcriptSource.platform,
      url: transcriptSource.url,
      has_timestamps: transcriptSource.hasTimestamps,
      verified: true,
      selected: true,
    });
    if (transcriptError) throw transcriptError;

    const { data: storedClaims, error: claimsError } = await database
      .from("claims")
      .insert(draft.claims.map((claim, position) => ({
        item_id: itemId,
        claim_code: claim.id,
        position: position + 1,
        title_zh: claim.titleZh,
        information_type: claim.informationType,
        assessment_zh: claim.assessmentZh,
      })))
      .select("id, claim_code");
    if (claimsError) throw claimsError;

    const claimIds = new Map(storedClaims.map((claim) => [claim.claim_code, claim.id]));
    const evidenceRows = draft.claims.flatMap((claim) => claim.evidence.map((evidence: Evidence) => ({
      claim_id: claimIds.get(claim.id),
      evidence_code: evidence.id,
      relation: evidence.relation,
      locator: evidence.locator,
      speaker: evidence.speaker,
      source_kind: evidence.sourceKind,
      quote: evidence.quote,
    })));
    if (evidenceRows.some((row) => !row.claim_id)) throw new Error("A claim could not be linked to its evidence.");
    const { data: storedEvidence, error: evidenceError } = await database
      .from("evidence")
      .insert(evidenceRows)
      .select("id,evidence_code,quote");
    if (evidenceError) throw evidenceError;

    const translations = await translateEvidenceBatchToChinese(storedEvidence);
    const { error: translationError } = await database.from("evidence_translations").upsert(
      storedEvidence.map((evidence) => ({
        evidence_id: evidence.id,
        translation_zh: translations.translations.get(evidence.id)!,
        model: translations.model,
      })),
      { onConflict: "evidence_id" },
    );
    if (translationError) throw translationError;
    await recordUsage({
      provider: "deepseek",
      model: translations.model,
      operation: "evidence_translation",
      status: "succeeded",
      itemId,
      promptTokens: translations.usage.promptTokens,
      completionTokens: translations.usage.completionTokens,
      totalTokens: translations.usage.totalTokens,
    });

    const { error: analysisError } = await database.from("analyses").insert({
      item_id: itemId,
      why_zh: draft.analysis.whyZh,
      horizontal_zh: draft.analysis.horizontalZh,
      cross_disciplinary_zh: draft.analysis.crossDisciplinaryZh,
      application_zh: draft.analysis.applicationZh,
      personal_zh: draft.analysis.personalZh,
      memory_zh: draft.analysis.memoryZh,
    });
    if (analysisError) throw analysisError;

    const { error: visualsError } = await database.from("visuals").insert({
      item_id: itemId,
      timeline: draft.visuals.timeline,
      tree: draft.visuals.tree,
      comparison: draft.visuals.comparison,
    });
    if (visualsError) throw visualsError;

    const searchRows = [];
    for (const document of createSearchDocuments(draft)) {
      const embeddingResult = await createSearchEmbedding(document.content);
      await recordUsage({
        provider: "dashscope",
        model: getPrivateEnv().QWEN_EMBEDDING_MODEL,
        operation: "embedding",
        status: "succeeded",
        itemId,
        promptTokens: embeddingResult.usage.promptTokens,
        totalTokens: embeddingResult.usage.totalTokens,
      });
      searchRows.push({
        item_id: itemId,
        document_type: document.documentType,
        reference_id: document.referenceId,
        content: document.content,
        embedding: embeddingResult.embedding,
      });
    }
    const { error: searchError } = await database.from("search_documents").insert(searchRows);
    if (searchError) throw searchError;

    const { error: publishError } = await database
      .from("knowledge_items")
      .update({ status: "ready", updated_at: new Date().toISOString() })
      .eq("id", itemId);
    if (publishError) throw publishError;

    const { error: completeError } = await database
      .from("processing_attempts")
      .update({ item_id: itemId, status: "succeeded", manual_retry_required: false, error_summary: null, updated_at: new Date().toISOString() })
      .eq("id", attempt.id);
    if (completeError) throw completeError;

    return { itemId, title: entry.title, segments: segments.length, claims: draft.claims.length, evidence: storedEvidence.length };
  } catch (error) {
    const message = failureMessage(error);
    if (itemId) {
      await database.from("knowledge_items").update({
        status: "processing_failed",
        unavailable_reason_zh: "自动处理失败，等待人工复核。",
        updated_at: new Date().toISOString(),
      }).eq("id", itemId);
    }
    await database.from("processing_attempts").update({
      item_id: itemId ?? null,
      status: "failed",
      manual_retry_required: true,
      error_summary: message,
      updated_at: new Date().toISOString(),
    }).eq("id", attempt.id);
    throw error;
  }
}

export async function runDailyAutomation() {
  const database = createServiceSupabaseClient();
  if (!database) throw new Error("Supabase service credentials are not configured.");
  const userId = await resolveOwnerId(database);
  const quota = await canProcessToday(database, userId);
  if (!quota.allowed) return { ok: true, status: "daily_limit_reached", ...quota };

  const phaseOneSources = SOURCES.filter((source) => source.enabled && source.phase === 1);
  const discovery = await Promise.allSettled(
    phaseOneSources.map(async (source) => ({ source, entries: await discoverSource(source, Number(process.env.DISCOVERY_LIMIT ?? "10")) })),
  );
  const failures = discovery
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => failureMessage(result.reason));

  for (const result of discovery) {
    if (result.status !== "fulfilled") continue;
    for (const entry of result.value.entries) {
      if (await isAlreadyHandled(database, userId, entry)) continue;
      try {
        const candidate = await prepareCandidate(entry, result.value.source);
        if (!candidate) continue;
        const processed = await processCandidate(database, userId, candidate);
        return { ok: true, status: "processed", ...processed, discoveryFailures: failures };
      } catch (error) {
        failures.push(`${entry.sourceId}: ${failureMessage(error)}`);
        // Preparation failures are safe to skip. Once a candidate reaches model processing,
        // processCandidate records its failure and throws; do not spend more model calls today.
        if (error instanceof Error && !error.message.startsWith("Transcript fetch failed") && !error.message.startsWith("Official article fetch failed")) throw error;
      }
    }
  }

  return { ok: true, status: "no_eligible_verified_source", discoveryFailures: failures };
}
