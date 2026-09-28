import type { TranscriptSegment } from "./types";

const MAX_GROUP_CHARACTERS = 420;
const MAX_GROUP_DURATION_MS = 30_000;

export function compactTranscriptSegments(segments: TranscriptSegment[]): TranscriptSegment[] {
  if (!segments.some((segment) => segment.startMs !== undefined)) return segments;

  const groups: TranscriptSegment[][] = [];
  for (const segment of segments) {
    const current = groups.at(-1);
    const first = current?.[0];
    const currentCharacters = current?.reduce((total, entry) => total + entry.text.length + 1, 0) ?? 0;
    const endMs = segment.endMs ?? segment.startMs;
    const canMerge = Boolean(
      current?.length
      && first?.startMs !== undefined
      && endMs !== undefined
      && endMs - first.startMs <= MAX_GROUP_DURATION_MS
      && currentCharacters + segment.text.length <= MAX_GROUP_CHARACTERS
      && (first.speaker ?? "U") === (segment.speaker ?? "U"),
    );
    if (canMerge) current!.push(segment);
    else groups.push([segment]);
  }

  return groups.map((group, index) => ({
    id: `seg-${String(index + 1).padStart(5, "0")}`,
    text: group.map((segment) => segment.text.trim()).filter(Boolean).join(" "),
    startMs: group[0].startMs,
    endMs: group.at(-1)?.endMs ?? group.at(-1)?.startMs,
    speaker: group[0].speaker,
  }));
}
