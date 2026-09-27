import { afterEach, describe, expect, it, vi } from "vitest";
import { discoverYouTube } from "./discovery";
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
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const source = SOURCES[0];

    const entries = await discoverYouTube(source, 1);

    const firstUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(firstUrl.pathname.endsWith("/channels")).toBe(true);
    expect(firstUrl.searchParams.get("id")).toBe(source.discovery.youtubeChannelId);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/search"))).toBe(false);
    expect(entries[0]?.externalId).toBe("video-1");
  });
});
