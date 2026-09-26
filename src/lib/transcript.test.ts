import { describe, expect, it } from "vitest";
import { nextTranscriptRetry, parsePlainText, parseVtt, selectTranscriptSource } from "./transcript";

describe("transcript policy", () => {
  it("selects official transcript before CC and RSS", () => {
    const selected = selectTranscriptSource([
      { kind: "RSS", label: "RSS", platform: "Podcast", url: "https://example.com/rss.vtt", hasTimestamps: true, verified: true },
      { kind: "OS", label: "Official", platform: "Website", url: "https://example.com/official", hasTimestamps: false, verified: true },
    ]);
    expect(selected?.kind).toBe("OS");
  });

  it("ignores unverified transcript candidates", () => {
    expect(selectTranscriptSource([
      { kind: "OS", label: "Claimed", platform: "Unknown", url: "https://example.com", hasTimestamps: false, verified: false },
    ])).toBeUndefined();
  });

  it("uses 24h, 72h, 7d, then weekly retries", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    expect(nextTranscriptRetry(start, 0).toISOString()).toBe("2026-01-02T00:00:00.000Z");
    expect(nextTranscriptRetry(start, 1).toISOString()).toBe("2026-01-04T00:00:00.000Z");
    expect(nextTranscriptRetry(start, 2).toISOString()).toBe("2026-01-08T00:00:00.000Z");
    expect(nextTranscriptRetry(start, 8).toISOString()).toBe("2026-01-08T00:00:00.000Z");
  });
});

describe("transcript parsing", () => {
  it("parses VTT without keeping markup", () => {
    const result = parseVtt("WEBVTT\n\n00:00:01.000 --> 00:00:03.500\n<v Guest>Hello world.</v>");
    expect(result[0]).toMatchObject({ text: "Hello world.", startMs: 1000, endMs: 3500 });
  });

  it("turns plain text paragraphs into addressable segments", () => {
    expect(parsePlainText("First paragraph.\n\nSecond paragraph.")).toHaveLength(2);
  });
});
