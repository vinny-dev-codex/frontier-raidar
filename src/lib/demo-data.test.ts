import { describe, expect, it } from "vitest";
import { DEMO_ITEMS } from "./demo-data";

function treeLabels(node: { label: string; children?: { label: string; children?: unknown[] }[] }): string[] {
  return [node.label, ...(node.children?.flatMap((child) => treeLabels(child as never)) ?? [])];
}

describe("showcase data contract", () => {
  it("gives every ready item 5-10 evidence-grounded claims", () => {
    for (const item of DEMO_ITEMS.filter((candidate) => candidate.status === "ready")) {
      expect(item.claims?.length).toBeGreaterThanOrEqual(5);
      expect(item.claims?.length).toBeLessThanOrEqual(10);
      expect(item.transcriptSource?.verified).toBe(true);
      for (const claim of item.claims ?? []) {
        expect(claim.evidence.length).toBeGreaterThan(0);
        for (const evidence of claim.evidence) {
          expect(evidence.quote).not.toMatch(/[\u3400-\u9fff]/u);
          expect(evidence.locator.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("keeps every visual label in English", () => {
    for (const item of DEMO_ITEMS) {
      const labels = [
        ...(item.visuals?.timeline?.map((entry) => entry.label) ?? []),
        ...(item.visuals?.tree ? treeLabels(item.visuals.tree) : []),
        ...(item.visuals?.comparison?.flatMap((row) => [row.question, row.viewA, row.viewB]) ?? []),
      ];
      labels.forEach((label) => expect(label).not.toMatch(/[\u3400-\u9fff]/u));
    }
  });

  it("never attaches generated analysis to unavailable content", () => {
    for (const item of DEMO_ITEMS.filter((candidate) => candidate.status !== "ready")) {
      expect(item.claims).toBeUndefined();
      expect(item.analysis).toBeUndefined();
    }
  });
});
