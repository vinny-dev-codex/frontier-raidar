import { describe, expect, it } from "vitest";
import { compactTranscriptSegments } from "./transcript-compaction";

describe("compactTranscriptSegments", () => {
  it("merges adjacent timed caption fragments while keeping exact text and bounds", () => {
    const compacted = compactTranscriptSegments([
      { id: "old-1", text: "The first exact fragment.", startMs: 0, endMs: 3_000 },
      { id: "old-2", text: "The second exact fragment.", startMs: 3_000, endMs: 6_000 },
    ]);
    expect(compacted).toEqual([{
      id: "seg-00001",
      text: "The first exact fragment. The second exact fragment.",
      startMs: 0,
      endMs: 6_000,
      speaker: undefined,
    }]);
  });

  it("does not merge paragraph-based article segments", () => {
    const paragraphs = [
      { id: "seg-00001", text: "One", paragraph: 1 },
      { id: "seg-00002", text: "Two", paragraph: 2 },
    ];
    expect(compactTranscriptSegments(paragraphs)).toBe(paragraphs);
  });

  it("keeps different speakers in separate groups", () => {
    const compacted = compactTranscriptSegments([
      { id: "a", text: "One", startMs: 0, endMs: 1_000, speaker: "A" },
      { id: "b", text: "Two", startMs: 1_000, endMs: 2_000, speaker: "B" },
    ]);
    expect(compacted).toHaveLength(2);
  });
});
