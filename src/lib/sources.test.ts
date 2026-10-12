import { describe, expect, it } from "vitest";
import { SOURCES } from "./sources";

describe("source registry", () => {
  it("contains the 30 unique enabled sources in strict priority order", () => {
    expect(SOURCES).toHaveLength(30);
    expect(new Set(SOURCES.map((source) => source.id)).size).toBe(30);
    expect(SOURCES.every((source) => source.enabled)).toBe(true);
    expect(SOURCES.map((source) => source.priority)).toEqual(Array.from({ length: 30 }, (_, index) => index + 1));
  });

  it("pins every source to one unique official YouTube channel", () => {
    const channelIds = SOURCES.map((source) => source.discovery.youtubeChannelId);
    expect(channelIds.every((id) => /^UC[\w-]{20,}$/.test(id))).toBe(true);
    expect(new Set(channelIds).size).toBe(30);
  });

  it("keeps Huberman Lab high, publishes it directly, and lowers Acquired", () => {
    const huberman = SOURCES.find((source) => source.id === "huberman-lab");
    const acquired = SOURCES.find((source) => source.id === "acquired");
    const wayde = SOURCES.find((source) => source.id === "wayde-ai");
    expect(huberman?.priority).toBe(2);
    expect(huberman?.publicationPolicy).toBe("standard");
    expect(wayde?.publicationPolicy).toBe("standard");
    expect(acquired?.priority).toBe(30);
  });

  it("promotes the requested creators and places the lowered sources last", () => {
    for (const id of ["dan-koe", "brain-inspired", "lex-fridman", "erin-meryl-mcgurk"]) {
      expect(SOURCES.find((source) => source.id === id)?.priority).toBeLessThanOrEqual(17);
    }
    const alex = SOURCES.find((source) => source.id === "alex-hormozi");
    expect(alex?.priority).toBeLessThanOrEqual(10);
    expect(alex?.discovery.youtubeChannelId).toBe("UCUyDOdBWhC1MCxEjC46d-zw");
    expect(SOURCES.slice(-5).map((source) => source.id)).toEqual([
      "freakonomics-radio", "radiolab", "stanford-hai", "google-deepmind", "acquired",
    ]);
  });
});
