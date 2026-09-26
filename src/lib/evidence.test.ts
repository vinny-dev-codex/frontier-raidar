import { describe, expect, it } from "vitest";
import { materializeEvidence } from "./evidence";

const transcript = [
  { id: "s1", text: "The original exact sentence.", startMs: 1000, endMs: 3000, speaker: "G1" },
  { id: "s2", text: "A second exact sentence.", startMs: 3000, endMs: 5000, speaker: "G1" },
];

describe("evidence materialization", () => {
  it("copies exact transcript text rather than model-generated quotes", () => {
    const [evidence] = materializeEvidence(
      [{ id: "P01", relation: "PRIMARY", segmentIds: ["s1", "s2"] }],
      transcript,
      "OS",
    );
    expect(evidence.quote).toBe("The original exact sentence. A second exact sentence.");
    expect(evidence.locator).toBe("00:01–00:05");
  });

  it("rejects a hallucinated segment id", () => {
    expect(() => materializeEvidence(
      [{ id: "P01", relation: "PRIMARY", segmentIds: ["missing"] }],
      transcript,
      "OS",
    )).toThrow(/missing transcript segment/);
  });
});
