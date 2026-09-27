import { describe, expect, it } from "vitest";
import { SOURCES } from "./sources";

describe("source registry", () => {
  it("contains the 29 unique enabled sources in strict priority order", () => {
    expect(SOURCES).toHaveLength(29);
    expect(new Set(SOURCES.map((source) => source.id)).size).toBe(29);
    expect(SOURCES.every((source) => source.enabled)).toBe(true);
    expect(SOURCES.map((source) => source.priority)).toEqual(Array.from({ length: 29 }, (_, index) => index + 1));
  });

  it("pins every source to one unique official YouTube channel", () => {
    const channelIds = SOURCES.map((source) => source.discovery.youtubeChannelId);
    expect(channelIds.every((id) => /^UC[\w-]{20,}$/.test(id))).toBe(true);
    expect(new Set(channelIds).size).toBe(29);
  });

  it("keeps Huberman Lab high, publishes it directly, and lowers Acquired", () => {
    const huberman = SOURCES.find((source) => source.id === "huberman-lab");
    const acquired = SOURCES.find((source) => source.id === "acquired");
    const wayde = SOURCES.find((source) => source.id === "wayde-ai");
    expect(huberman?.priority).toBe(2);
    expect(huberman?.publicationPolicy).toBe("standard");
    expect(wayde?.publicationPolicy).toBe("standard");
    expect(acquired?.priority).toBe(10);
  });
});
