import type { Evidence, TranscriptSegment, TranscriptKind } from "./types";

type EvidenceSelection = {
  id: string;
  relation: Evidence["relation"];
  segmentIds: string[];
};

function formatTimestamp(milliseconds?: number) {
  if (milliseconds === undefined) return undefined;
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function locatorFor(segments: TranscriptSegment[]) {
  const first = segments[0];
  const last = segments[segments.length - 1];
  if (first?.startMs !== undefined) {
    const start = formatTimestamp(first.startMs);
    const end = formatTimestamp(last?.endMs ?? last?.startMs);
    return end ? `${start}–${end}` : start ?? "";
  }
  if (first?.paragraph !== undefined) return `§${String(first.paragraph).padStart(2, "0")}`;
  return "unlocated";
}

export function materializeEvidence(
  selections: EvidenceSelection[],
  transcript: TranscriptSegment[],
  sourceKind: TranscriptKind,
) {
  const byId = new Map(transcript.map((segment, index) => [segment.id, { segment, index }]));

  return selections.map((selection) => {
    const selected = selection.segmentIds.map((id) => byId.get(id));
    if (selected.some((entry) => !entry)) {
      throw new Error(`Evidence ${selection.id} references a missing transcript segment.`);
    }
    const exactEntries = (selected as { segment: TranscriptSegment; index: number }[]).toSorted((left, right) => left.index - right.index);
    const exactSegments = exactEntries.map((entry) => entry.segment);
    const quote = exactEntries.reduce((text, entry, index) => {
      if (index === 0) return entry.segment.text.trim();
      const separator = entry.index === exactEntries[index - 1].index + 1 ? " " : " […] ";
      return `${text}${separator}${entry.segment.text.trim()}`;
    }, "");
    return {
      id: selection.id,
      relation: selection.relation,
      locator: locatorFor(exactSegments),
      speaker: exactSegments[0]?.speaker ?? "U",
      sourceKind,
      quote,
    } satisfies Evidence;
  });
}
