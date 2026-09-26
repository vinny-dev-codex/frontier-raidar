import type { ComparisonRow, TimelineEvent, TreeNode } from "@/lib/types";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="timeline" aria-label="时间线">
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

export function KnowledgeTree({ root }: { root: TreeNode }) {
  return (
    <div className="knowledge-tree" aria-label="知识树">
      <ul>
        <TreeBranch node={root} />
      </ul>
    </div>
  );
}

export function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>问题</th>
            <th>观点 A</th>
            <th>观点 B</th>
            <th>证据</th>
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
