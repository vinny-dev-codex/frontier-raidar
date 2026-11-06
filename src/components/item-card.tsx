import Link from "next/link";
import { StatusBadge } from "./status-badge";
import { ReadingActions } from "./reading-actions";
import type { KnowledgeItem } from "@/lib/types";
import type { Locale } from "./reading-language";

export function ItemCard({ item, locale = "zh" }: { item: KnowledgeItem; locale?: Locale }) {
  const english = locale === "en";
  const translation = english && item.english?.summary.trim() ? item.english : undefined;
  const itemHref = `/item/${encodeURIComponent(item.id)}`;

  return (
    <article className="item-card" lang={english ? "en" : "zh-CN"}>
      <div className="item-card-topline">
        <span>{item.sourceName}{item.isDemo ? (english ? " · Demo" : " · 演示") : ""}</span>
        <time dateTime={item.publishedAt}>{item.publishedAt}</time>
      </div>
      <div className="item-card-title-row">
        <h2>
          <Link href={itemHref}>{item.title}</Link>
        </h2>
        <ReadingActions compact itemId={item.id} locale={locale} />
      </div>
      <StatusBadge status={item.status} locale={locale} />
      {item.status === "ready" ? (
        <>{english && !translation ? <p className="section-note">English not available yet · Showing Chinese</p> : null}<p lang={translation ? "en" : "zh-CN"}>{translation?.summary ?? item.summaryZh}</p></>
      ) : (
        <p className="muted" lang="zh-CN">{item.unavailableReasonZh}</p>
      )}
      <div className="tag-list" aria-label={english ? "Topics" : "主题标签"} lang={translation ? "en" : "zh-CN"}>
        {(translation?.tags ?? item.tags).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </article>
  );
}
