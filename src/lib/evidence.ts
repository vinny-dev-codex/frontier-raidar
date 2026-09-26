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
  const byId = new Map(transcript.map((segment) => [segment.id, segment]));

  return selections.map((selection) => {
    const segments = selection.segmentIds.map((id) => byId.get(id));
    if (segments.some((segment) => !segment)) {
      throw new Error(`Evidence ${selection.id} references a missing transcript segment.`);
    }
    const exactSegments = segments as TranscriptSegment[];
    return {
      id: selection.id,
      relation: selection.relation,
      locator: locatorFor(exactSegments),
      speaker: exactSegments[0]?.speaker ?? "U",
      sourceKind,
      quote: exactSegments.map((segment) => segment.text.trim()).join(" "),
    } satisfies Evidence;
  });
}
