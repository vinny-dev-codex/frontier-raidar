import { getPrivateEnv } from "../src/lib/env";
import { createEnglishLocalization } from "../src/lib/localization";
import { loadLiveItems } from "../src/lib/live-data";
import { createServiceSupabaseClient } from "../src/lib/supabase";

async function main() {
  const database = createServiceSupabaseClient();
  if (!database) throw new Error("Supabase service credentials are not configured.");
  const items = (await loadLiveItems()).filter((item) => item.status === "ready");
  const force = process.env.LOCALIZATION_FORCE === "true";
  const { data: existing, error: existingError } = await database
    .from("knowledge_item_localizations")
    .select("item_id")
    .eq("locale", "en");
  if (existingError) throw existingError;
  const completed = new Set((existing ?? []).map((row) => row.item_id));
  const results = [];

  for (const item of items) {
    if (!force && completed.has(item.id)) {
      results.push({ itemId: item.id, status: "already_cached" });
      continue;
    }
    if (!item.summaryZh || !item.claims || !item.analysis || !item.visuals) {
      results.push({ itemId: item.id, status: "incomplete_source_card" });
      continue;
    }
    const { data: owner, error: ownerError } = await database.from("knowledge_items").select("user_id,updated_at").eq("id", item.id).single();
    if (ownerError) throw ownerError;
    try {
      const localized = await createEnglishLocalization({
        summaryZh: item.summaryZh,
        tags: item.tags,
        claims: item.claims,
        analysis: item.analysis,
        visuals: item.visuals,
      });
      const { error: upsertError } = await database.from("knowledge_item_localizations").upsert({
        item_id: item.id,
        locale: "en",
        content: localized.localization,
        model: localized.model,
        source_updated_at: owner.updated_at,
        updated_at: new Date().toISOString(),
      }, { onConflict: "item_id,locale" });
      if (upsertError) throw upsertError;
      const { error: usageError } = await database.from("model_usage_events").insert({
        user_id: owner.user_id,
        item_id: item.id,
        provider: "deepseek",
        model: localized.model,
        operation: "english_localization_backfill",
        status: "succeeded",
        prompt_tokens: localized.usage.promptTokens,
        completion_tokens: localized.usage.completionTokens,
        total_tokens: localized.usage.totalTokens,
      });
      if (usageError) throw usageError;
      results.push({ itemId: item.id, status: "cached", totalTokens: localized.usage.totalTokens });
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown localization error";
      await database.from("model_usage_events").insert({
        user_id: owner.user_id,
        item_id: item.id,
        provider: "deepseek",
        model: getPrivateEnv().DEEPSEEK_MODEL,
        operation: "english_localization_backfill",
        status: "failed",
        error_summary: message,
      });
      results.push({ itemId: item.id, status: "failed", error: message });
    }
  }

  console.log(JSON.stringify({ ok: results.every((result) => result.status !== "failed"), results }, null, 2));
  if (results.some((result) => result.status === "failed")) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
