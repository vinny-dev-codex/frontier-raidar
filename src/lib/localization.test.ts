import { describe, expect, it } from "vitest";
import { materializeEnglishLocalization, type LocalizableKnowledge } from "./localization";

const input: LocalizableKnowledge = {
  summaryZh: "摘要",
  tags: ["标签一", "标签二"],
  claims: [{ id: "C1", titleZh: "论点", assessmentZh: "判断" }],
  analysis: {
    whyZh: ["为什么"], horizontalZh: ["横向"], crossDisciplinaryZh: ["跨学科"], applicationZh: ["应用"], personalZh: ["个人"],
    memoryZh: { keywords: ["甲", "乙", "丙"], analogy: "类比", recallQuestion: "问题" },
  },
  visuals: {
    timeline: [{ locator: "00:01", label: "事件", claimId: "C1" }],
    tree: { label: "根", children: [{ label: "叶" }] },
    comparison: [{ question: "问题", viewA: "甲", viewB: "乙", evidenceIds: ["E1"] }],
  },
};

const translated = {
  summary: "Summary",
  tags: ["Tag one", "Tag two"],
  claims: [{ title: "Claim", assessment: "Assessment" }],
  analysis: {
    why: ["Why"], horizontal: ["Horizontal"], crossDisciplinary: ["Cross-disciplinary"], application: ["Application"], personal: ["Personal"],
    memory: { keywords: ["A", "B", "C"], analogy: "Analogy", recallQuestion: "Question" },
  },
  visuals: {
    timelineLabels: ["Event"],
    tree: { label: "Root", children: [{ label: "Leaf" }] },
    comparison: [{ question: "Question", viewA: "A", viewB: "B" }],
  },
};

describe("materializeEnglishLocalization", () => {
  it("restores identifiers and evidence links from the Chinese source", () => {
    const result = materializeEnglishLocalization(input, translated);
    expect(result.claims[0].id).toBe("C1");
    expect(result.visuals.timeline[0]).toEqual({ locator: "00:01", label: "Event", claimId: "C1" });
    expect(result.visuals.comparison[0].evidenceIds).toEqual(["E1"]);
  });

  it("rejects translated arrays with a changed shape", () => {
    expect(() => materializeEnglishLocalization(input, { ...translated, claims: [] })).toThrow(/claims array length/);
  });
});
