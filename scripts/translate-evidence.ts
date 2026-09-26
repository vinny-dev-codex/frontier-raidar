import { createServiceSupabaseClient } from "../src/lib/supabase";
import { translateEvidenceBatchToChinese } from "../src/lib/translation";

const itemId = process.argv[2];

async function main() {
  if (!itemId) throw new Error("Usage: npm run translate:evidence -- <knowledge-item-uuid>");
  const database = createServiceSupabaseClient();
  if (!database) throw new Error("Supabase service credentials are not configured.");

  const { data: evidence, error } = await database
    .from("evidence")
    .select("id,evidence_code,quote,claims!inner(item_id)")
    .eq("claims.item_id", itemId);
  if (error) throw error;
  const rows = evidence ?? [];
  if (!rows.length) throw new Error("No evidence was found for this knowledge card.");

  const { data: existing, error: existingError } = await database
    .from("evidence_translations")
    .select("evidence_id")
    .in("evidence_id", rows.map((row) => row.id));
  if (existingError) throw existingError;
  const existingIds = new Set((existing ?? []).map((row) => row.evidence_id));
  const untranslated = rows.filter((row) => !existingIds.has(row.id));
  if (!untranslated.length) {
    console.log(JSON.stringify({ ok: true, itemId, translated: 0, message: "All translations already exist." }));
    return;
  }
  const pending = untranslated.slice(0, 3);

  const usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  for (const row of pending) {
    const result = await translateEvidenceBatchToChinese([{ id: row.id, quote: row.quote }]);
    const { error: saveError } = await database.from("evidence_translations").upsert(
      { evidence_id: row.id, translation_zh: result.translations.get(row.id)!, model: result.model },
      { onConflict: "evidence_id" },
    );
    if (saveError) throw saveError;
    usage.promptTokens += result.usage.promptTokens ?? 0;
    usage.completionTokens += result.usage.completionTokens ?? 0;
    usage.totalTokens += result.usage.totalTokens ?? 0;
  }
  console.log(JSON.stringify({ ok: true, itemId, translated: pending.length, remaining: untranslated.length - pending.length, usage }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
