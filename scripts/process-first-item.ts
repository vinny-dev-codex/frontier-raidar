import { buildKnowledgeDraft, createSearchDocuments } from "../src/lib/pipeline";
import { ModelResponseError } from "../src/lib/deepseek";
import { sendKnowledgeCardEmail } from "../src/lib/email";
import { getPrivateEnv } from "../src/lib/env";
import { createSearchEmbedding } from "../src/lib/qwen";
import { createServiceSupabaseClient } from "../src/lib/supabase";
import { fetchTranscriptTemporarily } from "../src/lib/transcript";
import type { Evidence, TranscriptSource } from "../src/lib/types";

const ITEM = {
  externalId: "68b66323-6e74-4c90-8157-ef3f1ed0d042",
  sourceId: "acquired",
  sourceName: "Acquired",
  title: "The Home Depot",
  canonicalUrl: "https://www.acquired.fm/episodes/home-depot",
  publishedAt: "2026-09-14T03:35:03.000Z",
  durationSeconds: 12902,
};

const transcriptSource: TranscriptSource = {
  kind: "RSS",
  label: "Acquired official Podcast RSS transcript (VTT)",
  platform: "Podcast RSS",
  url: "https://share.transistor.fm/s/8ecb4ed4/transcript.vtt",
  hasTimestamps: true,
  verified: true,
};

async function main() {
  const database = createServiceSupabaseClient();
  if (!database) throw new Error("Supabase service credentials are not configured.");

  const env = getPrivateEnv();
  const { data: users, error: usersError } = await database.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });
  if (usersError) throw usersError;
  const owner = env.OWNER_EMAIL
    ? users.users.find((user) => user.email?.toLocaleLowerCase() === env.OWNER_EMAIL?.toLocaleLowerCase())
    : users.users.length === 1 ? users.users[0] : undefined;
  if (!owner?.email) {
    throw new Error("Set OWNER_EMAIL when more than one user exists, and ensure it matches a verified Supabase Auth email.");
  }
  const userId = owner.id;
  const { data: quota, error: quotaError } = await database.rpc("database_quota_status");
  if (quotaError) throw quotaError;
  const quotaStatus = Array.isArray(quota) ? quota[0] : quota;
  if (quotaStatus?.warning) {
    throw new Error(`Supabase database warning threshold reached (${quotaStatus.database_bytes} bytes). Processing is paused before the 500 MB Free-plan cap.`);
  }
  const dailyLimit = Number.parseInt(process.env.DAILY_PROCESS_LIMIT ?? "1", 10);
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count: processedToday, error: usageCountError } = await database
    .from("model_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("provider", "deepseek")
    .eq("operation", "knowledge_extraction")
    .eq("status", "succeeded")
    .gte("created_at", startOfDay.toISOString());
  if (usageCountError) throw usageCountError;
  if ((processedToday ?? 0) >= dailyLimit) {
    throw new Error(`Daily DeepSeek processing limit reached (${dailyLimit}). Try again tomorrow.`);
  }

  const { data: priorAttempt, error: priorAttemptError } = await database
    .from("processing_attempts")
    .select("id, status")
    .eq("user_id", userId)
    .eq("source_id", ITEM.sourceId)
    .eq("external_id", ITEM.externalId)
    .maybeSingle();
  if (priorAttemptError) throw priorAttemptError;
  if (priorAttempt?.status === "failed" && process.env.FORCE_RETRY !== "true") {
    throw new Error("The previous processing attempt failed. Set FORCE_RETRY=true for a deliberate manual retry.");
  }
  const { data: attempt, error: attemptError } = await database
    .from("processing_attempts")
    .upsert({ user_id: userId, source_id: ITEM.sourceId, external_id: ITEM.externalId, status: "processing", manual_retry_required: false, error_summary: null }, { onConflict: "user_id,source_id,external_id" })
    .select("id")
    .single();
  if (attemptError) throw attemptError;

  const recordUsage = async (event: {
    provider: "deepseek" | "dashscope";
    model: string;
    operation: string;
    status: "succeeded" | "failed";
    promptTokens?: number | null;
    completionTokens?: number | null;
    totalTokens?: number | null;
    itemId?: string | null;
    errorSummary?: string | null;
  }) => {
    const { error } = await database.from("model_usage_events").insert({
      user_id: userId, attempt_id: attempt.id, item_id: event.itemId ?? null,
      provider: event.provider, model: event.model, operation: event.operation, status: event.status,
      prompt_tokens: event.promptTokens ?? null, completion_tokens: event.completionTokens ?? null,
      total_tokens: event.totalTokens ?? null, error_summary: event.errorSummary ?? null,
    });
    if (error) throw error;
  };

  const segments = await fetchTranscriptTemporarily(transcriptSource);
  if (segments.length === 0) throw new Error("The official transcript contained no usable segments.");

  let draft: Awaited<ReturnType<typeof buildKnowledgeDraft>>;
  try {
    draft = await buildKnowledgeDraft({ title: ITEM.title, sourceName: ITEM.sourceName, sourceKind: transcriptSource.kind, segments });
  } catch (error) {
    const usage = error instanceof ModelResponseError ? error.usage : undefined;
    await recordUsage({
      provider: "deepseek", model: getPrivateEnv().DEEPSEEK_MODEL, operation: "knowledge_extraction", status: "failed",
      promptTokens: usage?.promptTokens, completionTokens: usage?.completionTokens, totalTokens: usage?.totalTokens,
      errorSummary: error instanceof Error ? error.message.slice(0, 500) : "Unknown model error",
    });
    await database.from("processing_attempts").update({ status: "failed", manual_retry_required: true, error_summary: error instanceof Error ? error.message.slice(0, 500) : "Unknown model error", updated_at: new Date().toISOString() }).eq("id", attempt.id);
    throw error;
  }
  await recordUsage({
    provider: "deepseek", model: draft.model, operation: "knowledge_extraction", status: "succeeded",
    promptTokens: draft.modelUsage.promptTokens, completionTokens: draft.modelUsage.completionTokens, totalTokens: draft.modelUsage.totalTokens,
  });

  const { data: item, error: itemError } = await database
    .from("knowledge_items")
    .upsert({
      user_id: userId,
      source_id: ITEM.sourceId,
      external_id: ITEM.externalId,
      title: ITEM.title,
      canonical_url: ITEM.canonicalUrl,
      kind: "podcast",
      status: "ready",
      published_at: ITEM.publishedAt,
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

  const itemId = item.id;
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
    platform: "Podcast RSS",
    url: ITEM.canonicalUrl,
    duration_seconds: ITEM.durationSeconds,
    published_at: ITEM.publishedAt,
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
  const { error: evidenceError } = await database.from("evidence").insert(evidenceRows);
  if (evidenceError) throw evidenceError;

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

  const documents = createSearchDocuments(draft);
  const searchRows = [];
  for (const document of documents) {
    let embeddingResult: Awaited<ReturnType<typeof createSearchEmbedding>>;
    try {
      embeddingResult = await createSearchEmbedding(document.content);
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown embedding error";
      await recordUsage({ provider: "dashscope", model: getPrivateEnv().QWEN_EMBEDDING_MODEL, operation: "embedding", status: "failed", errorSummary: message, itemId });
      await database.from("processing_attempts").update({ status: "failed", manual_retry_required: true, error_summary: message, updated_at: new Date().toISOString() }).eq("id", attempt.id);
      throw error;
    }
    await recordUsage({
      provider: "dashscope", model: getPrivateEnv().QWEN_EMBEDDING_MODEL, operation: "embedding", status: "succeeded", itemId,
      promptTokens: embeddingResult.usage.promptTokens, totalTokens: embeddingResult.usage.totalTokens,
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
  const { error: attemptCompleteError } = await database.from("processing_attempts")
    .update({ item_id: itemId, status: "succeeded", manual_retry_required: false, error_summary: null, updated_at: new Date().toISOString() })
    .eq("id", attempt.id);
  if (attemptCompleteError) throw attemptCompleteError;

  const { data: priorDelivery, error: priorDeliveryError } = await database
    .from("notification_deliveries")
    .select("id")
    .eq("item_id", itemId)
    .eq("recipient_user_id", userId)
    .eq("channel", "email")
    .maybeSingle();
  if (priorDeliveryError) throw priorDeliveryError;
  if (!priorDelivery) {
    const cardUrl = new URL(`/item/${itemId}`, env.APP_URL).toString();
    try {
      const delivery = await sendKnowledgeCardEmail({ recipient: owner.email, title: ITEM.title, summaryZh: draft.summaryZh, cardUrl, sourceUrl: ITEM.canonicalUrl });
      const { error: deliveryError } = await database.from("notification_deliveries").insert({
        item_id: itemId, recipient_user_id: userId, channel: "email", status: delivery.status,
        provider_message_id: "providerMessageId" in delivery ? delivery.providerMessageId : null,
        error_summary: "error" in delivery ? delivery.error : null,
        sent_at: delivery.status === "sent" ? new Date().toISOString() : null,
      });
      if (deliveryError) throw deliveryError;
    } catch (error) {
      const { error: deliveryError } = await database.from("notification_deliveries").insert({
        item_id: itemId, recipient_user_id: userId, channel: "email", status: "failed",
        error_summary: error instanceof Error ? error.message.slice(0, 500) : "Unknown email error",
      });
      if (deliveryError) throw deliveryError;
    }
  }

  console.log(JSON.stringify({
    ok: true,
    itemId,
    title: ITEM.title,
    transcriptSegments: segments.length,
    claims: draft.claims.length,
    evidence: evidenceRows.length,
    searchDocuments: searchRows.length,
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
