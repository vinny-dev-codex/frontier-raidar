import type { Metadata } from "next";
import { SOURCES } from "@/lib/sources";

export const metadata: Metadata = { title: "来源" };

export default function SourcesPage() {
  const verifiedCount = SOURCES.filter((source) => source.phase === 1).length;
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">SOURCES</p>
        <h1>来源管理</h1>
        <p>12 个来源全部保留在计划中。每个入口必须完成发现和文稿规则验证后，才会进入自动处理。</p>
      </section>
      <section className="stats-grid source-stats" aria-label="来源状态">
        <div><strong>{SOURCES.length}</strong><span>计划来源</span></div>
        <div><strong>{verifiedCount}</strong><span>已验证发现</span></div>
        <div><strong>{SOURCES.filter((source) => source.discovery.rss).length}</strong><span>已登记 RSS</span></div>
        <div><strong>0</strong><span>绕过付费墙</span></div>
      </section>
      <div className="source-list">
        {SOURCES.map((source) => (
          <article className="source-card" key={source.id}>
            <div className="item-card-topline">
              <span className={`source-health phase-${source.phase}`}>{source.phase === 1 ? "已验证发现" : "待逐项接入"}</span><span>{source.category}</span>
            </div>
            <h2><a href={source.homepage} target="_blank" rel="noreferrer">{source.name}</a></h2>
            <dl>
              <div><dt>内容</dt><dd>{source.kinds.join(" / ")}</dd></div>
              <div><dt>入口</dt><dd>{Object.keys(source.discovery).join(" / ")}</dd></div>
              <div><dt>规则</dt><dd>{source.transcriptNotes}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}
