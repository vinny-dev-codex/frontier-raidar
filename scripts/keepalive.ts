import { createServiceSupabaseClient } from "../src/lib/supabase";

async function main() {
  const database = createServiceSupabaseClient();
  if (!database) throw new Error("Supabase service credentials are not configured.");
  const { count, error } = await database.from("sources").select("id", { count: "exact", head: true });
  if (error) throw error;
  const { data: quota, error: quotaError } = await database.rpc("database_quota_status");
  if (quotaError) throw quotaError;
  const quotaStatus = Array.isArray(quota) ? quota[0] : quota;
  console.log(JSON.stringify({
    ok: true,
    checkedAt: new Date().toISOString(),
    sourceCount: count ?? 0,
    databaseBytes: quotaStatus?.database_bytes ?? null,
    quotaWarning: quotaStatus?.warning ?? null,
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
