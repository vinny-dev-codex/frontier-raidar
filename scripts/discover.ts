import { discoverSource } from "../src/lib/discovery";
import { SOURCES } from "../src/lib/sources";

const limit = Number(process.env.DISCOVERY_LIMIT ?? 5);
const enabledSources = SOURCES.filter((source) => source.enabled).toSorted((a, b) => a.priority - b.priority);

async function main() {
  const results = await Promise.allSettled(
    enabledSources.map(async (source) => ({ source, entries: await discoverSource(source, limit) })),
  );

  let failures = 0;
  for (const result of results) {
    if (result.status === "rejected") {
      failures += 1;
      console.error(JSON.stringify({ ok: false, error: String(result.reason) }));
      continue;
    }
    console.log(JSON.stringify({
      ok: true,
      source: result.value.source.name,
      count: result.value.entries.length,
      entries: result.value.entries,
    }, null, 2));
  }

  if (failures === results.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
