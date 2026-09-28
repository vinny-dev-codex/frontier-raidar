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

  it("sorts evidence chronologically and marks omitted transcript segments", () => {
    const extended = [...transcript, { id: "s3", text: "An omitted sentence.", startMs: 5000, endMs: 7000, speaker: "G1" }, { id: "s4", text: "A later exact sentence.", startMs: 7000, endMs: 9000, speaker: "G1" }];
    const [evidence] = materializeEvidence(
      [{ id: "P02", relation: "SUP", segmentIds: ["s4", "s1"] }],
      extended,
      "CC",
    );
    expect(evidence.quote).toBe("The original exact sentence. […] A later exact sentence.");
    expect(evidence.locator).toBe("00:01–00:09");
  });
});
