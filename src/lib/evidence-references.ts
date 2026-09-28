import type { TranscriptSegment } from "./types";

type EvidenceReference = { id: string; segmentIds: string[]; anchorText: string };
type ClaimWithEvidence = { id: string; evidence: EvidenceReference[] };

function numericSegmentId(value: string) {
  const match = value.trim().match(/^(?:seg(?:ment)?[-_ ]*)?0*(\d+)$/i);
  return match ? Number.parseInt(match[1], 10) : undefined;
}

function searchableText(value: string) {
  return (value.normalize("NFKC").toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).join(" ");
}

function locateAnchor(anchorText: string, segments: TranscriptSegment[]) {
  const anchor = searchableText(anchorText);
  if (anchor.split(" ").length < 4) return undefined;
  const candidates: { ids: string[]; length: number }[] = [];

  for (let start = 0; start < segments.length; start += 1) {
    for (let length = 1; length <= 3 && start + length <= segments.length; length += 1) {
      const window = segments.slice(start, start + length);
      if (searchableText(window.map((segment) => segment.text).join(" ")).includes(anchor)) {
        candidates.push({ ids: window.map((segment) => segment.id), length });
      }
    }
  }
  if (!candidates.length) return undefined;
  const shortest = Math.min(...candidates.map((candidate) => candidate.length));
  const unique = new Map(candidates.filter((candidate) => candidate.length === shortest).map((candidate) => [candidate.ids.join("|"), candidate.ids]));
  return unique.size === 1 ? [...unique.values()][0] : undefined;
}

export function reconcileEvidenceReferences<T extends ClaimWithEvidence>(claims: T[], segments: TranscriptSegment[]) {
  const byId = new Map(segments.map((segment) => [segment.id, segment.id]));
  const byNumber = new Map<number, string>();
  for (const segment of segments) {
    const number = numericSegmentId(segment.id);
    if (number !== undefined) byNumber.set(number, segment.id);
  }
  const unresolved: { claimId: string; evidenceId: string; segmentIds: string[] }[] = [];
  let corrected = 0;

  const reconciled = claims.map((claim) => ({
    ...claim,
    evidence: claim.evidence.map((evidence) => {
      const normalizedIds = evidence.segmentIds.map((id) => {
        const number = numericSegmentId(id);
        return byId.get(id) ?? (number === undefined ? undefined : byNumber.get(number));
      });
      if (normalizedIds.every((id): id is string => Boolean(id))) {
        const uniqueIds = [...new Set(normalizedIds)];
        if (uniqueIds.some((id, index) => id !== evidence.segmentIds[index])) corrected += 1;
        return { ...evidence, segmentIds: uniqueIds };
      }

      const anchorIds = locateAnchor(evidence.anchorText, segments);
      if (anchorIds) {
        corrected += 1;
        return { ...evidence, segmentIds: anchorIds };
      }
      unresolved.push({ claimId: claim.id, evidenceId: evidence.id, segmentIds: evidence.segmentIds });
      return evidence;
    }),
  })) as T[];

  return { claims: reconciled, unresolved, corrected };
}
