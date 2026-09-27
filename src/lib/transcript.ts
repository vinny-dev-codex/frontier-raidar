import type { TranscriptKind, TranscriptSegment, TranscriptSource } from "./types";

const YOUTUBE_PLAYER_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
const YOUTUBE_CLIENT_VERSION = "20.10.38";
const YOUTUBE_USER_AGENT = `com.google.android.youtube/${YOUTUBE_CLIENT_VERSION} (Linux; U; Android 14)`;
const YOUTUBE_WEB_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0 Safari/537.36";

const PRIORITY: Record<TranscriptKind, number> = {
  OS: 1,
  CC: 2,
  RSS: 3,
  PLT: 4,
  EXT: 5,
};

export function selectTranscriptSource(candidates: TranscriptSource[]) {
  return candidates
    .filter((candidate) => candidate.verified)
    .toSorted((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind])[0];
}

export function nextTranscriptRetry(firstCheckedAt: Date, retryCount: number) {
  const hours = retryCount === 0 ? 24 : retryCount === 1 ? 72 : retryCount === 2 ? 168 : 168;
  return new Date(firstCheckedAt.getTime() + hours * 60 * 60 * 1000);
}

function timestampToMs(value: string) {
  const parts = value.replace(",", ".").split(":");
  const seconds = Number(parts.pop());
  const minutes = Number(parts.pop() ?? 0);
  const hours = Number(parts.pop() ?? 0);
  return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
}

export function parseVtt(vtt: string): TranscriptSegment[] {
  const normalized = vtt.replace(/\r/g, "");
  const blocks = normalized.split(/\n{2,}/);
  const segments: TranscriptSegment[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const timingIndex = lines.findIndex((line) => line.includes(" --> "));
    if (timingIndex < 0) continue;
    const [start, rawEnd] = lines[timingIndex].split(" --> ");
    const end = rawEnd?.split(/\s+/)[0];
    const text = lines.slice(timingIndex + 1).join(" ").replace(/<[^>]+>/g, "").trim();
    if (!start || !end || !text) continue;
    segments.push({
      id: `seg-${String(segments.length + 1).padStart(5, "0")}`,
      startMs: timestampToMs(start),
      endMs: timestampToMs(end),
      text,
    });
  }
  return segments;
}

export function parsePlainText(text: string): TranscriptSegment[] {
  return text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((paragraph, index) => ({
      id: `seg-${String(index + 1).padStart(5, "0")}`,
      paragraph: index + 1,
      text: paragraph,
    }));
}

function decodeXmlEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&#(\d+);/g, (_, value: string) => String.fromCodePoint(Number.parseInt(value, 10)));
}

export function parseYouTubeCaptionXml(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const timedParagraph = /<p\s+[^>]*t="(\d+)"[^>]*d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match: RegExpExecArray | null;

  while ((match = timedParagraph.exec(xml)) !== null) {
    const text = decodeXmlEntities(match[3].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    if (!text) continue;
    const startMs = Number.parseInt(match[1], 10);
    const durationMs = Number.parseInt(match[2], 10);
    segments.push({
      id: `seg-${String(segments.length + 1).padStart(5, "0")}`,
      startMs,
      endMs: startMs + durationMs,
      text,
    });
  }

  if (segments.length > 0) return segments;

  const classicCaption = /<text\s+[^>]*start="([\d.]+)"[^>]*dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  while ((match = classicCaption.exec(xml)) !== null) {
    const text = decodeXmlEntities(match[3].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    if (!text) continue;
    const startMs = Math.round(Number.parseFloat(match[1]) * 1000);
    const durationMs = Math.round(Number.parseFloat(match[2]) * 1000);
    segments.push({
      id: `seg-${String(segments.length + 1).padStart(5, "0")}`,
      startMs,
      endMs: startMs + durationMs,
      text,
    });
  }
  return segments;
}

type CaptionTrack = {
  baseUrl?: string;
  languageCode?: string;
  kind?: string;
};

function captionPriority(track: CaptionTrack) {
  const english = track.languageCode === "en" || track.languageCode?.startsWith("en-");
  const automatic = track.kind === "asr";
  if (english && !automatic) return 0;
  if (english) return 1;
  if (!automatic) return 2;
  return 3;
}

function parseInlineJsonObject(html: string, marker: string) {
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return undefined;
  const jsonStart = html.indexOf("{", markerIndex + marker.length);
  if (jsonStart < 0) return undefined;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = jsonStart; index < html.length; index += 1) {
    const character = html[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(jsonStart, index + 1)) as unknown;
        } catch {
          return undefined;
        }
      }
    }
  }
  return undefined;
}

type YouTubePlayerPayload = {
  captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] } };
};

function captionTracks(payload: unknown) {
  return (payload as YouTubePlayerPayload | undefined)?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
}

async function fetchCaptionTracks(videoId: string) {
  const playerResponse = await fetch(YOUTUBE_PLAYER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": YOUTUBE_USER_AGENT },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      context: { client: { clientName: "ANDROID", clientVersion: YOUTUBE_CLIENT_VERSION } },
      videoId,
    }),
  });
  if (playerResponse.ok) {
    const tracks = captionTracks(await playerResponse.json());
    if (tracks.length > 0) return tracks;
  }

  const watchResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    headers: { "Accept-Language": "en-US,en;q=0.9", "User-Agent": YOUTUBE_WEB_USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!watchResponse.ok) throw new Error(`Transcript fetch failed: YouTube watch page returned ${watchResponse.status}.`);
  const html = await watchResponse.text();
  const webPayload = parseInlineJsonObject(html, "ytInitialPlayerResponse");
  return captionTracks(webPayload);
}

export async function fetchYouTubeCaptionsTemporarily(videoId: string) {
  if (!/^[\w-]{11}$/.test(videoId)) throw new Error("Transcript fetch failed: invalid YouTube video ID.");
  const tracks = await fetchCaptionTracks(videoId);
  const track = tracks.filter((candidate) => candidate.baseUrl).toSorted((a, b) => captionPriority(a) - captionPriority(b))[0];
  if (!track?.baseUrl) return undefined;

  const captionUrl = new URL(track.baseUrl);
  if (captionUrl.protocol !== "https:" || !(captionUrl.hostname === "youtube.com" || captionUrl.hostname.endsWith(".youtube.com"))) {
    throw new Error("Transcript fetch failed: YouTube returned an unexpected caption host.");
  }
  captionUrl.searchParams.set("fmt", "srv3");
  const captionResponse = await fetch(captionUrl, {
    headers: { "User-Agent": YOUTUBE_USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!captionResponse.ok) throw new Error(`Transcript fetch failed: caption download returned ${captionResponse.status}.`);
  const segments = parseYouTubeCaptionXml(await captionResponse.text());
  if (segments.length === 0) return undefined;

  const automatic = track.kind === "asr";
  const transcriptSource: TranscriptSource = {
    kind: automatic ? "PLT" : "CC",
    label: automatic ? "YouTube existing platform captions" : "YouTube creator-provided captions",
    platform: "YouTube",
    url: `https://www.youtube.com/watch?v=${videoId}`,
    hasTimestamps: true,
    verified: true,
  };
  return { segments, transcriptSource, languageCode: track.languageCode ?? "unknown", automatic };
}

export async function fetchTranscriptTemporarily(source: TranscriptSource) {
  if (!source.verified) throw new Error("Unverified transcript sources cannot be processed.");
  const response = await fetch(source.url, {
    headers: { "User-Agent": "FrontierRadar/0.1 (+personal knowledge reader)" },
  });
  if (!response.ok) throw new Error(`Transcript fetch failed with ${response.status}.`);
  const body = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  return source.hasTimestamps || contentType.includes("text/vtt") || source.url.endsWith(".vtt")
    ? parseVtt(body)
    : parsePlainText(body);
}
