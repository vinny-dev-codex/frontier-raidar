export const WORKFLOW_POLICY = {
  maximumDailyCards: 5,
  allowAudioTranscription: false,
  allowEmailDelivery: false,
  acceptedPrimaryText: [
    "official_article",
    "official_transcript",
    "creator_or_platform_captions",
    "publisher_rss_transcript",
  ],
} as const;

export function dailyCardLimit(value?: string) {
  const requested = Number.parseInt(value ?? String(WORKFLOW_POLICY.maximumDailyCards), 10);
  if (!Number.isFinite(requested) || requested < 1) return WORKFLOW_POLICY.maximumDailyCards;
  return Math.min(requested, WORKFLOW_POLICY.maximumDailyCards);
}
