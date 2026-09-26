import type { TranscriptKind, TranscriptSegment, TranscriptSource } from "./types";

const PRIORITY: Record<TranscriptKind, number> = {
  OS: 1,
  CC: 2,
  RSS: 3,
  PLT: 4,
  EXT: 5,
};

export function selectTranscriptSource(candidates: TranscriptSource[]) {
  return candidates
    .filter((candidate) => candidate.verified)
    .toSorted((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind])[0];
}

export function nextTranscriptRetry(firstCheckedAt: Date, retryCount: number) {
  const hours = retryCount === 0 ? 24 : retryCount === 1 ? 72 : retryCount === 2 ? 168 : 168;
  return new Date(firstCheckedAt.getTime() + hours * 60 * 60 * 1000);
}

function timestampToMs(value: string) {
  const parts = value.replace(",", ".").split(":");
  const seconds = Number(parts.pop());
  const minutes = Number(parts.pop() ?? 0);
  const hours = Number(parts.pop() ?? 0);
  return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
}

export function parseVtt(vtt: string): TranscriptSegment[] {
  const normalized = vtt.replace(/\r/g, "");
  const blocks = normalized.split(/\n{2,}/);
  const segments: TranscriptSegment[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const timingIndex = lines.findIndex((line) => line.includes(" --> "));
    if (timingIndex < 0) continue;
    const [start, rawEnd] = lines[timingIndex].split(" --> ");
    const end = rawEnd?.split(/\s+/)[0];
    const text = lines.slice(timingIndex + 1).join(" ").replace(/<[^>]+>/g, "").trim();
    if (!start || !end || !text) continue;
    segments.push({
      id: `seg-${String(segments.length + 1).padStart(5, "0")}`,
      startMs: timestampToMs(start),
      endMs: timestampToMs(end),
      text,
    });
  }
  return segments;
}

export function parsePlainText(text: string): TranscriptSegment[] {
  return text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((paragraph, index) => ({
      id: `seg-${String(index + 1).padStart(5, "0")}`,
      paragraph: index + 1,
      text: paragraph,
    }));
}

export async function fetchTranscriptTemporarily(source: TranscriptSource) {
  if (!source.verified) throw new Error("Unverified transcript sources cannot be processed.");
  const response = await fetch(source.url, {
    headers: { "User-Agent": "FrontierRadar/0.1 (+personal knowledge reader)" },
  });
  if (!response.ok) throw new Error(`Transcript fetch failed with ${response.status}.`);
  const body = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  return source.hasTimestamps || contentType.includes("text/vtt") || source.url.endsWith(".vtt")
    ? parseVtt(body)
    : parsePlainText(body);
}
