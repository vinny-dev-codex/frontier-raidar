import { describe, expect, it } from "vitest";
import { dailyCardLimit, startOfSydneyDay, WORKFLOW_POLICY } from "./workflow-policy";

describe("final workflow policy", () => {
  it("never permits more than five cards per day", () => {
    expect(dailyCardLimit()).toBe(5);
    expect(dailyCardLimit("2")).toBe(2);
    expect(dailyCardLimit("99")).toBe(5);
  });

  it("forbids audio transcription and email delivery", () => {
    expect(WORKFLOW_POLICY.allowAudioTranscription).toBe(false);
    expect(WORKFLOW_POLICY.allowEmailDelivery).toBe(false);
  });

  it("counts the daily limit from Sydney midnight", () => {
    expect(startOfSydneyDay(new Date("2026-01-15T12:00:00Z")).toISOString()).toBe("2026-01-14T13:00:00.000Z");
    expect(startOfSydneyDay(new Date("2026-07-15T12:00:00Z")).toISOString()).toBe("2026-07-14T14:00:00.000Z");
  });
});
