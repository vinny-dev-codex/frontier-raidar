import { describe, expect, it } from "vitest";
import { dailyCardLimit, WORKFLOW_POLICY } from "./workflow-policy";

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
});
