import { describe, expect, it, vi } from "vitest";
import { searchOfficialYouTubeChannel } from "./youtube";

describe("YouTube discovery", () => {
  it("requires an API key before calling the network", async () => {
    vi.stubEnv("YOUTUBE_API_KEY", "");
    await expect(searchOfficialYouTubeChannel({ channelId: "UC123" })).rejects.toThrow("YOUTUBE_API_KEY");
    vi.unstubAllEnvs();
  });
});
