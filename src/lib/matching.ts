export function normalizeTitle(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']s\b/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string) {
  return new Set(normalizeTitle(value).split(" ").filter(Boolean));
}

export function titleSimilarity(a: string, b: string) {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (left.size === 0 || right.size === 0) return 0;

  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return intersection / union;
}

export function durationSimilarity(a?: number, b?: number) {
  if (!a || !b) return 0.5;
  const difference = Math.abs(a - b);
  return Math.max(0, 1 - difference / Math.max(a, b));
}

export function dateSimilarity(a?: string, b?: string) {
  if (!a || !b) return 0.5;
  const days = Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86_400_000;
  if (days <= 1) return 1;
  if (days <= 3) return 0.8;
  if (days <= 7) return 0.5;
  return 0;
}

export function platformMatchScore(input: {
  titleA: string;
  titleB: string;
  durationA?: number;
  durationB?: number;
  dateA?: string;
  dateB?: string;
  publisherMatches: boolean;
  guestMatches?: boolean;
}) {
  const title = titleSimilarity(input.titleA, input.titleB);
  const duration = durationSimilarity(input.durationA, input.durationB);
  const date = dateSimilarity(input.dateA, input.dateB);
  const publisher = input.publisherMatches ? 1 : 0;
  const guest = input.guestMatches === undefined ? 0.5 : input.guestMatches ? 1 : 0;

  return Number(
    (title * 0.4 + duration * 0.2 + date * 0.15 + publisher * 0.2 + guest * 0.05).toFixed(3),
  );
}

export function classifyMatch(score: number) {
  if (score >= 0.9) return "exact" as const;
  if (score >= 0.76) return "likely" as const;
  if (score >= 0.58) return "edited" as const;
  return "related" as const;
}
