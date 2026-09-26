import Link from "next/link";
import { StatusBadge } from "./status-badge";
import type { KnowledgeItem } from "@/lib/types";

export function ItemCard({ item }: { item: KnowledgeItem }) {
  return (
    <article className="item-card">
      <div className="item-card-topline">
        <span>{item.sourceName}{item.isDemo ? " · 演示" : ""}</span>
        <time dateTime={item.publishedAt}>{item.publishedAt}</time>
      </div>
      <h2>
        <Link href={`/item/${item.id}`}>{item.title}</Link>
      </h2>
      <StatusBadge status={item.status} />
      {item.status === "ready" ? (
        <p>{item.summaryZh}</p>
      ) : (
        <p className="muted">{item.unavailableReasonZh}</p>
      )}
      <div className="tag-list" aria-label="主题标签">
        {item.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="card-footer-meta">
        <span>{item.kind.toUpperCase()}</span>
        <span>{item.platformVersions.length} 个平台版本</span>
        {item.claims ? <span>{item.claims.length} 个关键论点</span> : null}
      </div>
    </article>
  );
}
