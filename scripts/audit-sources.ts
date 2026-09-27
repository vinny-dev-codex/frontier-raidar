import { discoverYouTube } from "../src/lib/discovery";
import { SOURCES } from "../src/lib/sources";
import { fetchYouTubeCaptionsTemporarily } from "../src/lib/transcript";

const MINIMUM_VIDEO_SECONDS = 8 * 60;
const MINIMUM_SOURCE_CHARACTERS = 2_000;

async function auditSource(source: (typeof SOURCES)[number]) {
  try {
    const entries = await discoverYouTube(source, 10);
    let captionedVideos = 0;
    let shortVideos = 0;
    for (const entry of entries) {
      if (entry.durationSeconds !== undefined && entry.durationSeconds < MINIMUM_VIDEO_SECONDS) {
        shortVideos += 1;
        continue;
      }
      const captions = await fetchYouTubeCaptionsTemporarily(entry.externalId);
      if (!captions) continue;
      const characters = captions.segments.reduce((total, segment) => total + segment.text.length, 0);
      if (characters < MINIMUM_SOURCE_CHARACTERS) continue;
      captionedVideos += 1;
    }
    return {
      priority: source.priority,
      source: source.name,
      status: captionedVideos > 0 ? "ready_for_automation" : "metadata_only",
      inspectedVideos: entries.length,
      qualifyingCaptionedVideos: captionedVideos,
      skippedShortVideos: shortVideos,
    };
  } catch (error) {
    return {
      priority: source.priority,
      source: source.name,
      status: "discovery_error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const results = [];
  for (let index = 0; index < SOURCES.length; index += 3) {
    results.push(...await Promise.all(SOURCES.slice(index, index + 3).map(auditSource)));
  }
  const ready = results.filter((result) => result.status === "ready_for_automation").length;
  console.log(JSON.stringify({
    ok: ready === SOURCES.length,
    auditedSources: SOURCES.length,
    readyForAutomation: ready,
    needsAttention: SOURCES.length - ready,
    results,
  }, null, 2));
  if (ready !== SOURCES.length) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
