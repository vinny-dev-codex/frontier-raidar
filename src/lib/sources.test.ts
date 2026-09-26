import { describe, expect, it } from "vitest";
import { SOURCES } from "./sources";

describe("source registry", () => {
  it("contains twelve unique enabled sources", () => {
    expect(SOURCES).toHaveLength(12);
    expect(new Set(SOURCES.map((source) => source.id)).size).toBe(12);
    expect(SOURCES.every((source) => source.enabled)).toBe(true);
  });

  it("keeps the verified first wave intentionally small", () => {
    expect(SOURCES.filter((source) => source.phase === 1).map((source) => source.id).sort()).toEqual([
      "acquired",
      "hidden-brain",
      "the-batch",
    ]);
  });
});
