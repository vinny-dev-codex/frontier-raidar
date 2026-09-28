import { describe, expect, it } from "vitest";
import { reconcileEvidenceReferences } from "./evidence-references";

const segments = [
  { id: "seg-00001", text: "A unique exact source phrase appears in this segment." },
  { id: "seg-00002", text: "Another source sentence follows afterward." },
];

describe("reconcileEvidenceReferences", () => {
  it("normalizes an equivalent segment number without a model retry", () => {
    const result = reconcileEvidenceReferences([{ id: "C1", evidence: [{ id: "e1", segmentIds: ["segment_1"], anchorText: "A unique exact source phrase" }] }], segments);
    expect(result.claims[0].evidence[0].segmentIds).toEqual(["seg-00001"]);
    expect(result.unresolved).toHaveLength(0);
  });

  it("uses an exact source anchor when the supplied id is wrong", () => {
    const result = reconcileEvidenceReferences([{ id: "C1", evidence: [{ id: "e1", segmentIds: ["not-a-real-id"], anchorText: "unique exact source phrase appears" }] }], segments);
    expect(result.claims[0].evidence[0].segmentIds).toEqual(["seg-00001"]);
    expect(result.corrected).toBe(1);
  });

  it("leaves ambiguous or absent anchors unresolved for a controlled retry", () => {
    const result = reconcileEvidenceReferences([{ id: "C1", evidence: [{ id: "e1", segmentIds: ["missing"], anchorText: "words that are not in transcript" }] }], segments);
    expect(result.unresolved).toEqual([{ claimId: "C1", evidenceId: "e1", segmentIds: ["missing"] }]);
  });
});
