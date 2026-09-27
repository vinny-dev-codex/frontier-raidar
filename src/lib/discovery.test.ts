import { afterEach, describe, expect, it, vi } from "vitest";
import { discoverYouTube, iso8601DurationToSeconds, rankDiscoveredEntries } from "./discovery";
import { SOURCES } from "./sources";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("YouTube discovery", () => {
  it("uses the verified channel ID and never searches by source name", async () => {
    vi.stubEnv("YOUTUBE_API_KEY", "test-key");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [{ contentDetails: { relatedPlaylists: { uploads: "UU-verified" } } }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [{ contentDetails: { videoId: "video-1", videoPublishedAt: "2026-09-27T00:00:00Z" }, snippet: { title: "Verified upload" } }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [{ id: "video-1", contentDetails: { duration: "PT1H2M3S" } }],
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const source = SOURCES[0];

    const entries = await discoverYouTube(source, 1);

    const firstUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(firstUrl.pathname.endsWith("/channels")).toBe(true);
    expect(firstUrl.searchParams.get("id")).toBe(source.discovery.youtubeChannelId);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/search"))).toBe(false);
    expect(entries[0]?.externalId).toBe("video-1");
    expect(entries[0]?.durationSeconds).toBe(3723);
  });

  it("parses ISO 8601 video durations", () => {
    expect(iso8601DurationToSeconds("PT12M5S")).toBe(725);
    expect(iso8601DurationToSeconds("PT2H")).toBe(7200);
  });
});

describe("source entry ranking", () => {
  it("prefers explicit transcripts, then existing YouTube captions, then plain RSS pages", () => {
    const base = {
      sourceId: "test",
      title: "Example",
      canonicalUrl: "https://example.com/item",
    };
    const ranked = rankDiscoveredEntries([
      { ...base, externalId: "rss-plain", platform: "Podcast RSS", transcriptUrls: [] },
      { ...base, externalId: "youtube", platform: "YouTube", transcriptUrls: [] },
      { ...base, externalId: "rss-transcript", platform: "Podcast RSS", transcriptUrls: ["https://example.com/transcript"] },
    ]);

    expect(ranked.map((entry) => entry.externalId)).toEqual(["rss-transcript", "youtube", "rss-plain"]);
  });
});
