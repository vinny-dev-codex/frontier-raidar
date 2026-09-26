import * as cheerio from "cheerio";
import Parser from "rss-parser";
import type { SourceDefinition } from "./types";

export type DiscoveredEntry = {
  externalId: string;
  sourceId: string;
  title: string;
  canonicalUrl: string;
  publishedAt?: string;
  description?: string;
  durationSeconds?: number;
  platform: "Podcast RSS" | "Official Website";
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

export async function discoverTheBatch(source: SourceDefinition, limit = 20) {
  const response = await fetch(source.homepage, {
    headers: { "User-Agent": "FrontierRadar/0.1 (+personal knowledge reader)" },
  });
  if (!response.ok) throw new Error(`The Batch discovery failed with ${response.status}.`);
  const $ = cheerio.load(await response.text());
  const found = new Map<string, DiscoveredEntry>();

  $("a[href]").each((_, element) => {
    const rawHref = $(element).attr("href");
    const title = $(element).attr("aria-label")?.trim()
      || $(element).find("h2,h3,h4").first().text().trim()
      || $(element).text().trim();
    if (!rawHref || !title || title.length < 12) return;
    const url = new URL(rawHref, source.homepage);
    if (!/^\/the-batch\/issue-\d+\/?$/.test(url.pathname)) return;
    url.hash = "";
    const canonicalUrl = url.toString();
    if (!found.has(canonicalUrl)) {
      found.set(canonicalUrl, {
        externalId: canonicalUrl,
        sourceId: source.id,
        title: title.replace(/\s+/g, " ").slice(0, 300),
        canonicalUrl,
        platform: "Official Website",
        transcriptUrls: [],
      });
    }
  });
  return [...found.values()].slice(0, limit);
}

export async function discoverSource(source: SourceDefinition, limit = 20) {
  if (source.id === "the-batch") return discoverTheBatch(source, limit);
  if (source.discovery.rss) return discoverRss(source, limit);
  return [];
}
