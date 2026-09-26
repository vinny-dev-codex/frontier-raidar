import type { Evidence } from "@/lib/types";

export function SourceCode({ evidence }: { evidence: Evidence }) {
  return (
    <span className="source-code">
      [{evidence.locator}][{evidence.speaker}][{evidence.sourceKind}][{evidence.relation}]
    </span>
  );
}
