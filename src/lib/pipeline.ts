import { extractKnowledgeFromTranscript, ModelResponseError } from "./deepseek";
import { materializeEvidence } from "./evidence";
import { compactTranscriptSegments } from "./transcript-compaction";
import type { TranscriptKind, TranscriptSegment } from "./types";

export async function buildKnowledgeDraft(input: {
  title: string;
  sourceName: string;
  sourceKind: TranscriptKind;
  segments: TranscriptSegment[];
}) {
  if (input.segments.length === 0) throw new Error("A verified transcript is required.");
  const evidenceSegments = compactTranscriptSegments(input.segments);
  const result = await extractKnowledgeFromTranscript({ ...input, segments: evidenceSegments });
  const extraction = result.extraction;
  let claims;
  try {
    claims = extraction.claims.map((claim) => ({
      id: claim.id,
      titleZh: claim.titleZh,
      informationType: claim.informationType,
      assessmentZh: claim.assessmentZh,
      evidence: materializeEvidence(claim.evidence, evidenceSegments, input.sourceKind),
    }));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown evidence validation error";
    throw new ModelResponseError(`Evidence validation failed after automatic reference repair: ${reason}`, result.usage);
  }
  return { ...extraction, claims, modelUsage: result.usage, model: result.model };
}

export function createSearchDocuments(draft: Awaited<ReturnType<typeof buildKnowledgeDraft>>) {
  return [
    { documentType: "summary", referenceId: "summary", content: draft.summaryZh },
    ...draft.claims.map((claim) => ({
      documentType: "claim",
      referenceId: claim.id,
      content: `${claim.titleZh}\n${claim.assessmentZh}`,
    })),
    ...draft.claims.map((claim) => ({
      documentType: "evidence_group",
      referenceId: claim.id,
      content: claim.evidence.map((evidence) => evidence.quote).join("\n"),
    })),
    { documentType: "tags", referenceId: "tags", content: draft.tags.join(" ") },
  ];
}
