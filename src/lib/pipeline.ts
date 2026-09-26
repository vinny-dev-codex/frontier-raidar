import { extractKnowledgeFromTranscript } from "./deepseek";
import { materializeEvidence } from "./evidence";
import type { TranscriptKind, TranscriptSegment } from "./types";

export async function buildKnowledgeDraft(input: {
  title: string;
  sourceName: string;
  sourceKind: TranscriptKind;
  segments: TranscriptSegment[];
}) {
  if (input.segments.length === 0) throw new Error("A verified transcript is required.");
  const result = await extractKnowledgeFromTranscript(input);
  const extraction = result.extraction;
  const claims = extraction.claims.map((claim) => ({
    id: claim.id,
    titleZh: claim.titleZh,
    informationType: claim.informationType,
    assessmentZh: claim.assessmentZh,
    evidence: materializeEvidence(claim.evidence, input.segments, input.sourceKind),
  }));
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
