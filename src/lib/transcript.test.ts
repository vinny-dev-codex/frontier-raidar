import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchYouTubeCaptionsTemporarily, nextTranscriptRetry, parsePlainText, parseVtt, parseYouTubeCaptionXml, selectTranscriptSource } from "./transcript";

afterEach(() => vi.unstubAllGlobals());

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

  it("parses YouTube timed-text XML", () => {
    expect(parseYouTubeCaptionXml('<timedtext><body><p t="1000" d="2500">Hello &amp; world.</p></body></timedtext>')[0])
      .toMatchObject({ text: "Hello & world.", startMs: 1000, endMs: 3500 });
  });

  it("uses existing YouTube captions without audio transcription", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ captions: { playerCaptionsTracklistRenderer: { captionTracks: [
        { languageCode: "en", baseUrl: "https://www.youtube.com/api/timedtext?v=video-id001" },
      ] } } }), { status: 200 }))
      .mockResolvedValueOnce(new Response('<timedtext><body><p t="0" d="1000">Existing caption.</p></body></timedtext>', { status: 200 })));
    const result = await fetchYouTubeCaptionsTemporarily("video-id001");
    expect(result?.transcriptSource.kind).toBe("CC");
    expect(result?.segments[0]?.text).toBe("Existing caption.");
  });

  it("falls back to caption tracks embedded in the public watch page", async () => {
    const embedded = JSON.stringify({ captions: { playerCaptionsTracklistRenderer: { captionTracks: [
      { languageCode: "en", baseUrl: "https://www.youtube.com/api/timedtext?v=video-id001" },
    ] } } });
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(new Response(`<script>var ytInitialPlayerResponse = ${embedded};</script>`, { status: 200 }))
      .mockResolvedValueOnce(new Response('<timedtext><body><p t="0" d="1000">Watch-page caption.</p></body></timedtext>', { status: 200 })));
    const result = await fetchYouTubeCaptionsTemporarily("video-id001");
    expect(result?.segments[0]?.text).toBe("Watch-page caption.");
  });
});
