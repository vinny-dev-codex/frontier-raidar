import { describe, expect, it } from "vitest";
import { extractArticleSegments } from "./article";

describe("official article extraction", () => {
  it("keeps article paragraphs and drops navigation", () => {
    const segments = extractArticleSegments(`
      <nav><p>This navigation text is long enough but must be removed completely.</p></nav>
      <article>
        <p>This is the first substantive paragraph in the official article body.</p>
        <aside><p>This recommendation must not become source evidence in the article.</p></aside>
        <p>This is the second substantive paragraph with enough context for extraction.</p>
      </article>
    `);
    expect(segments.map((segment) => segment.text)).toEqual([
      "This is the first substantive paragraph in the official article body.",
      "This is the second substantive paragraph with enough context for extraction.",
    ]);
    expect(segments[0]?.paragraph).toBe(1);
  });

  it("returns no content when no article or main body exists", () => {
    expect(extractArticleSegments("<div><p>Unscoped content should not be trusted as the article.</p></div>")).toEqual([]);
  });
});
