import { SOURCES } from "../src/lib/sources";
import { createServiceSupabaseClient } from "../src/lib/supabase";

async function main() {
  const database = createServiceSupabaseClient();
  if (!database) throw new Error("Supabase service credentials are not configured.");
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [quotaResult, itemResult, sourceResult, usageResult] = await Promise.all([
    database.rpc("database_quota_status"),
    database.from("knowledge_items").select("id,source_id,status", { count: "exact" }),
    database.from("sources").select("id", { count: "exact", head: true }).eq("enabled", true),
    database.from("model_usage_events").select("provider,operation,status,total_tokens").gte("created_at", since),
  ]);
  const error = quotaResult.error ?? itemResult.error ?? sourceResult.error ?? usageResult.error;
  if (error) throw error;

  const quota = Array.isArray(quotaResult.data) ? quotaResult.data[0] : quotaResult.data;
  const providerUsage = (usageResult.data ?? []).reduce<Record<string, { events: number; failed: number; tokens: number }>>((totals, event) => {
    const current = totals[event.provider] ?? { events: 0, failed: 0, tokens: 0 };
    current.events += 1;
    current.failed += event.status === "failed" ? 1 : 0;
    current.tokens += event.total_tokens ?? 0;
    totals[event.provider] = current;
    return totals;
  }, {});
  const readyItems = (itemResult.data ?? []).filter((item) => item.status === "ready");
  console.log(JSON.stringify({
    ok: true,
    supabase: {
      databaseBytes: quota?.database_bytes ?? null,
      warningThresholdBytes: quota?.warning_threshold_bytes ?? null,
      warning: quota?.warning ?? null,
      totalItems: itemResult.count ?? 0,
      readyItems: readyItems.length,
      readySourceCount: new Set(readyItems.map((item) => item.source_id)).size,
      enabledSources: sourceResult.count ?? 0,
    },
    modelUsageLast30Days: providerUsage,
    youtube: {
      estimatedDataApiUnitsPerDailyRun: SOURCES.length * 3,
      note: "channels.list + playlistItems.list + videos.list; existing caption retrieval does not use Data API quota",
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
