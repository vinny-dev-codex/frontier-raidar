import Parser from "rss-parser";
import { getPrivateEnv } from "./env";
import type { SourceDefinition } from "./types";

export type DiscoveredEntry = {
  externalId: string;
  sourceId: string;
  title: string;
  canonicalUrl: string;
  publishedAt?: string;
  description?: string;
  durationSeconds?: number;
  platform: "Podcast RSS" | "Official Website" | "YouTube";
  transcriptUrls: string[];
};

type FeedItem = {
  guid?: string;
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  itunes?: { duration?: string | number };
  "podcast:transcript"?: unknown;
};

const parser = new Parser<Record<string, never>, FeedItem>({
  customFields: { item: [["podcast:transcript", "podcast:transcript", { keepArray: true }]] },
});

function durationToSeconds(value?: string | number) {
  if (value === undefined) return undefined;
  if (typeof value === "number") return value;
  if (/^\d+$/.test(value)) return Number(value);
  const parts = value.split(":").map(Number);
  if (parts.some(Number.isNaN)) return undefined;
  return parts.reduce((total, part) => total * 60 + part, 0);
}
function collectTranscriptUrls(value: unknown): string[] {
  const urls = new Set<string>();
  const visit = (node: unknown) => {
    if (typeof node === "string" && /^https?:\/\//.test(node)) urls.add(node);
    else if (Array.isArray(node)) node.forEach(visit);
    else if (node && typeof node === "object") Object.values(node).forEach(visit);
  };
  visit(value);
  return [...urls];
}
export async function discoverRss(source: SourceDefinition, limit = 20) {
  if (!source.discovery.rss) return [];
  const feed = await parser.parseURL(source.discovery.rss);
  return feed.items.slice(0, limit).flatMap((item) => {
    if (!item.title || !item.link) return [];
    return [{
      externalId: item.guid ?? item.link,
      sourceId: source.id,
      title: item.title.trim(),
      canonicalUrl: item.link,
      publishedAt: item.isoDate ?? item.pubDate,
      description: item.contentSnippet,
      durationSeconds: durationToSeconds(item.itunes?.duration),
      platform: "Podcast RSS" as const,
      transcriptUrls: collectTranscriptUrls(item["podcast:transcript"]),
    }];
  });
}
export async function discoverSource(source: SourceDefinition, limit = 20) {
  const failures: string[] = [];
  for (const method of source.collectionOrder) {
    try {
      const entries = method === "rss"
        ? await discoverRss(source, limit)
        : method === "youtube"
          ? await discoverYouTube(source, limit)
          : [];
      if (entries.length > 0) return entries;
    } catch (error) {
      failures.push(`${method}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (failures.length > 0) throw new Error(`${source.name} discovery failed (${failures.join("; ")}).`);
  return [];
}

export async function discoverYouTube(source: SourceDefinition, limit = 20) {
  const env = getPrivateEnv();
  if (!env.YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY is not configured.");
  const call = async (path: string, query: Record<string, string>) => {
    const url = new URL(`${env.YOUTUBE_API_BASE_URL}/${path}`);
    url.search = new URLSearchParams({ ...query, key: env.YOUTUBE_API_KEY! }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`YouTube ${path} failed with ${response.status}.`);
    return response.json();
  };
  const detail = await call("channels", { part: "contentDetails", id: source.discovery.youtubeChannelId }) as { items?: { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[] };
  const uploads = detail.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) return [];
  const payload = await call("playlistItems", { part: "snippet,contentDetails", playlistId: uploads, maxResults: String(limit) }) as { items?: { contentDetails?: { videoId?: string; videoPublishedAt?: string }; snippet?: { title?: string; description?: string; publishedAt?: string } }[] };
  return (payload.items ?? []).flatMap((item) => {
    const videoId = item.contentDetails?.videoId;
    const title = item.snippet?.title?.trim();
    if (!videoId || !title) return [];
    return [{ externalId: videoId, sourceId: source.id, title, canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`, publishedAt: item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt, description: item.snippet?.description, platform: "YouTube" as const, transcriptUrls: [] }];
  });
}

