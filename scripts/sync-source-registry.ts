import { SOURCES } from "../src/lib/sources";
import { createServiceSupabaseClient } from "../src/lib/supabase";

async function main() {
  const database = createServiceSupabaseClient();
  if (!database) throw new Error("Supabase service credentials are not configured.");

  const { error: disableError } = await database
    .from("sources")
    .update({ enabled: false })
    .neq("id", "");
  if (disableError) throw disableError;

  const rows = SOURCES.map((source) => ({
    id: source.id,
    name: source.name,
    category: source.category,
    homepage: source.homepage,
    enabled: source.enabled,
    phase: source.phase,
  }));
  const { error: upsertError } = await database.from("sources").upsert(rows, { onConflict: "id" });
  if (upsertError) throw upsertError;

  const { data: enabled, error: verifyError } = await database
    .from("sources")
    .select("id")
    .eq("enabled", true);
  if (verifyError) throw verifyError;
  const actualIds = new Set((enabled ?? []).map((source) => source.id));
  const expectedIds = new Set(SOURCES.map((source) => source.id));
  const exactMatch = actualIds.size === expectedIds.size && [...expectedIds].every((id) => actualIds.has(id));
  if (!exactMatch) throw new Error(`Source sync verification failed: expected ${expectedIds.size}, found ${actualIds.size}.`);

  console.log(JSON.stringify({ ok: true, enabledSources: actualIds.size }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
