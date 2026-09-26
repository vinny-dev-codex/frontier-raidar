import { getPrivateEnv } from "./env";

export type YouTubeVideo = {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  url: string;
};

/**
 * Uses the official YouTube Data API v3 only. The caller must verify the
 * channel ID before treating returned videos as a configured source.
 */
export async function searchOfficialYouTubeChannel(input: {
  channelId: string;
  maxResults?: number;
}) {
  const env = getPrivateEnv();
  if (!env.YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY is not configured.");

  const url = new URL(`${env.YOUTUBE_API_BASE_URL}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", input.channelId);
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", String(Math.min(Math.max(input.maxResults ?? 10, 1), 50)));
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`YouTube discovery failed with ${response.status}.`);
  const payload = await response.json() as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        description?: string;
        publishedAt?: string;
        channelId?: string;
        channelTitle?: string;
      };
    }>;
  };

  return (payload.items ?? []).flatMap((item) => {
    const videoId = item.id?.videoId;
    const snippet = item.snippet;
    if (!videoId || !snippet?.title || !snippet.publishedAt || !snippet.channelId || !snippet.channelTitle) return [];
    return [{
      videoId,
      title: snippet.title,
      description: snippet.description ?? "",
      publishedAt: snippet.publishedAt,
      channelId: snippet.channelId,
      channelTitle: snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    } satisfies YouTubeVideo];
  });
}
