import * as cheerio from "cheerio";
import type { TranscriptSegment } from "./types";

export function extractArticleSegments(html: string): TranscriptSegment[] {
  const $ = cheerio.load(html);
  $("script,style,noscript,nav,footer,aside,form").remove();
  const root = $("article").first().length ? $("article").first() : $("main").first();
  if (!root.length) return [];

  return root
    .find("p")
    .toArray()
    .map((element) => $(element).text().replace(/\s+/g, " ").trim())
    .filter((text) => text.length >= 30)
    .map((text, index) => ({
      id: `paragraph-${String(index + 1).padStart(4, "0")}`,
      paragraph: index + 1,
      text,
    }));
}

export async function fetchOfficialArticle(url: string, officialHomepage: string) {
  const articleUrl = new URL(url);
  const officialUrl = new URL(officialHomepage);
  if (articleUrl.hostname !== officialUrl.hostname) {
    throw new Error("Article URL is not on the configured official publisher domain.");
  }
  const response = await fetch(articleUrl, {
    headers: { "User-Agent": "FrontierRadar/0.1 (+personal knowledge reader)" },
  });
  if (!response.ok) throw new Error(`Official article fetch failed with ${response.status}.`);
  return extractArticleSegments(await response.text());
}
