import type { ComparisonRow, TimelineEvent, TreeNode } from "@/lib/types";

export function Timeline({ events, locale = "zh" }: { events: TimelineEvent[]; locale?: "zh" | "en" }) {
  return (
    <ol className="timeline" aria-label={locale === "en" ? "Timeline" : "时间线"}>
      {events.map((event) => (
        <li key={`${event.locator}-${event.label}`}>
          <span>{event.locator}</span>
          <strong>{event.label}</strong>
          {event.claimId ? <small>{event.claimId}</small> : null}
        </li>
      ))}
    </ol>
  );
}

function TreeBranch({ node }: { node: TreeNode }) {
  return (
    <li>
      <span>{node.label}</span>
      {node.children?.length ? (
        <ul>
          {node.children.map((child) => (
            <TreeBranch key={child.label} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function KnowledgeTree({ root, locale = "zh" }: { root: TreeNode; locale?: "zh" | "en" }) {
  return (
    <div className="knowledge-tree" aria-label={locale === "en" ? "Knowledge tree" : "知识树"}>
      <ul>
        <TreeBranch node={root} />
      </ul>
    </div>
  );
}

export function ComparisonTable({ rows, locale = "zh" }: { rows: ComparisonRow[]; locale?: "zh" | "en" }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{locale === "en" ? "Question" : "问题"}</th>
            <th>{locale === "en" ? "View A" : "观点 A"}</th>
            <th>{locale === "en" ? "View B" : "观点 B"}</th>
            <th>{locale === "en" ? "Evidence" : "证据"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.question}>
              <td>{row.question}</td>
              <td>{row.viewA}</td>
              <td>{row.viewB}</td>
              <td>{row.evidenceIds.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
