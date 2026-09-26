import type { Evidence, KnowledgeItem } from "@/lib/types";
import { SourceCode } from "./source-code";

function InlineTerms({ quote, terms }: { quote: string; terms: KnowledgeItem["terms"] }) {
  const usableTerms = terms.filter((term) => term.en.trim().length > 2 && term.zh.trim());
  if (!usableTerms.length) return quote;
  const alternatives = usableTerms
    .map((term) => term.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((left, right) => right.length - left.length);
  const matcher = new RegExp(`(${alternatives.join("|")})`, "gi");
  const parts = quote.split(matcher);
  return parts.map((part, index) => {
    const term = usableTerms.find((candidate) => candidate.en.toLocaleLowerCase() === part.toLocaleLowerCase());
    return term ? <span key={`${part}-${index}`}>{part}<span className="term-translation" lang="zh-CN">（{term.zh}）</span></span> : part;
  });
}

export function EvidenceBlock({ evidence, terms = [] }: { evidence: Evidence; terms?: KnowledgeItem["terms"] }) {
  return (
    <blockquote className="evidence-block" id={evidence.id}>
      <SourceCode evidence={evidence} />
      <p lang="en">“<InlineTerms quote={evidence.quote} terms={terms} />”</p>
    </blockquote>
  );
}
