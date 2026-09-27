import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServiceSupabaseClient } from "../src/lib/supabase";

const targetItemIds = [
  "28542730-a3ac-44dc-8b9c-6815980d40e6",
  "2a66dedf-62c3-473d-84d0-a7282718370e",
] as const;

const backupRoot = process.env.FRONTIER_RADAR_BACKUP_DIR
  ?? "E:\\AI\\Codex\\FrontierRadar\\backups";

async function selectRows(
  database: NonNullable<ReturnType<typeof createServiceSupabaseClient>>,
  table: string,
  column: string,
  values: readonly string[],
) {
  if (values.length === 0) return [];
  const { data, error } = await database.from(table).select("*").in(column, [...values]);
  if (error) throw error;
  return data ?? [];
}

async function main() {
  const database = createServiceSupabaseClient();
  if (!database) throw new Error("Supabase service credentials are not configured.");

  const knowledgeItems = await selectRows(database, "knowledge_items", "id", targetItemIds);
  if (knowledgeItems.length !== targetItemIds.length) {
    throw new Error(`Expected ${targetItemIds.length} exact items, found ${knowledgeItems.length}; refusing cleanup.`);
  }
  if (knowledgeItems.some((item) => item.source_id !== "the-batch")) {
    throw new Error("A target item no longer belongs to The Batch; refusing cleanup.");
  }

  const claimRows = await selectRows(database, "claims", "item_id", targetItemIds);
  const claimIds = claimRows.map((row) => row.id as string);
  const evidenceRows = await selectRows(database, "evidence", "claim_id", claimIds);
  const evidenceIds = evidenceRows.map((row) => row.id as string);
  const externalIds = knowledgeItems.map((item) => item.external_id as string);
  const processingAttempts = await selectRows(database, "processing_attempts", "external_id", externalIds);
  const attemptIds = processingAttempts.map((row) => row.id as string);

  const backup = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    reason: "Archive before removing two obsolete The Batch partial items after the 29-source switch.",
    targetItemIds,
    tables: {
      knowledge_items: knowledgeItems,
      platform_versions: await selectRows(database, "platform_versions", "item_id", targetItemIds),
      transcript_sources: await selectRows(database, "transcript_sources", "item_id", targetItemIds),
      claims: claimRows,
      evidence: evidenceRows,
      evidence_translations: await selectRows(database, "evidence_translations", "evidence_id", evidenceIds),
      analyses: await selectRows(database, "analyses", "item_id", targetItemIds),
      visuals: await selectRows(database, "visuals", "item_id", targetItemIds),
      search_documents: await selectRows(database, "search_documents", "item_id", targetItemIds),
      reading_states: await selectRows(database, "reading_states", "item_id", targetItemIds),
      processing_attempts: processingAttempts,
      model_usage_events_by_item: await selectRows(database, "model_usage_events", "item_id", targetItemIds),
      model_usage_events_by_attempt: await selectRows(database, "model_usage_events", "attempt_id", attemptIds),
    },
  };

  await mkdir(backupRoot, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupRoot, `the-batch-partials-${stamp}.json`);
  await writeFile(backupPath, `${JSON.stringify(backup, null, 2)}\n`, { encoding: "utf8", flag: "wx" });

  if (!process.argv.includes("--apply")) {
    console.log(JSON.stringify({ ok: true, mode: "backup-only", backupPath, itemCount: knowledgeItems.length }));
    return;
  }

  const { error: attemptsError } = await database
    .from("processing_attempts")
    .delete()
    .eq("source_id", "the-batch")
    .in("external_id", externalIds);
  if (attemptsError) throw attemptsError;

  const { error: itemsError } = await database
    .from("knowledge_items")
    .delete()
    .eq("source_id", "the-batch")
    .in("id", [...targetItemIds]);
  if (itemsError) throw itemsError;

  const { data: remaining, error: verifyError } = await database
    .from("knowledge_items")
    .select("id")
    .in("id", [...targetItemIds]);
  if (verifyError) throw verifyError;
  if ((remaining ?? []).length > 0) throw new Error("Cleanup verification failed: one or more target items remain.");

  console.log(JSON.stringify({ ok: true, mode: "backup-and-remove", backupPath, removedItemIds: targetItemIds }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
