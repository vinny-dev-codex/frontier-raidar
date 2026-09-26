import { describe, expect, it } from "vitest";
import { classifyMatch, platformMatchScore, titleSimilarity } from "./matching";

describe("cross-platform matching", () => {
  it("normalizes punctuation and casing", () => {
    expect(titleSimilarity("AI’s New Market", "AI New Market")).toBe(1);
  });

  it("auto-merges only a strong exact match", () => {
    const score = platformMatchScore({
      titleA: "How AI Changes Product Building",
      titleB: "How AI Changes Product Building",
      durationA: 3600,
      durationB: 3595,
      dateA: "2026-09-17",
      dateB: "2026-09-17",
      publisherMatches: true,
      guestMatches: true,
    });
    expect(classifyMatch(score)).toBe("exact");
  });

  it("does not auto-merge a merely related title", () => {
    const score = platformMatchScore({
      titleA: "The Future of AI Agents",
      titleB: "Building Consumer Brands",
      publisherMatches: true,
    });
    expect(classifyMatch(score)).not.toBe("exact");
  });
});
