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

export function startOfSydneyDay(now = new Date()) {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(dateParts.find((value) => value.type === type)?.value);
  const year = part("year");
  const month = part("month");
  const day = part("day");
  const localMidnightAsUtc = Date.UTC(year, month - 1, day);
  // Twelve hours before the UTC representation is still before Sydney's 02:00
  // daylight-saving transition, so it yields the offset that applied at midnight.
  const offsetLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "Australia/Sydney",
    timeZoneName: "longOffset",
  }).formatToParts(new Date(localMidnightAsUtc - 12 * 60 * 60 * 1000))
    .find((value) => value.type === "timeZoneName")?.value;
  const offset = offsetLabel?.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if (!offset) throw new Error("Could not determine the Australia/Sydney UTC offset.");
  const direction = offset[1] === "+" ? 1 : -1;
  const offsetMinutes = direction * (Number(offset[2]) * 60 + Number(offset[3]));
  return new Date(localMidnightAsUtc - offsetMinutes * 60 * 1000);
}
