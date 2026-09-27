import type { Metadata } from "next";
import { SOURCES } from "@/lib/sources";

export const metadata: Metadata = { title: "来源" };

export default function SourcesPage() {
  const verifiedCount = SOURCES.filter((source) => source.discovery.youtubeChannelId).length;
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">SOURCES</p>
        <h1>来源管理</h1>
        <p>29 个频道是内容索引；采集时优先使用可靠、高效的官网、RSS 或现成文字材料。没有可验证文本就不制作卡片。</p>
      </section>
      <section className="stats-grid source-stats" aria-label="来源状态">
        <div><strong>{SOURCES.length}</strong><span>正式来源</span></div>
        <div><strong>{verifiedCount}</strong><span>官方频道已核验</span></div>
        <div><strong>{SOURCES.filter((source) => source.discovery.rss).length}</strong><span>已登记 RSS</span></div>
        <div><strong>0</strong><span>绕过付费墙</span></div>
      </section>
      <div className="source-list">
        {SOURCES.map((source) => (
          <article className="source-card" key={source.id}>
            <div className="item-card-topline">
              <span className={`source-health phase-${source.phase}`}>优先级 {source.priority}</span><span>{source.category}</span>
            </div>
            <h2><a href={source.homepage} target="_blank" rel="noreferrer">{source.name}</a></h2>
            <dl>
              <div><dt>内容</dt><dd>{source.kinds.join(" / ")}</dd></div>
              <div><dt>采集顺序</dt><dd>{source.collectionOrder.join(" → ")}</dd></div>
              <div><dt>规则</dt><dd>{source.transcriptNotes}</dd></div>
              {source.publicationPolicy === "external_corroboration_required" ? <div><dt>发布门禁</dt><dd>需要额外研究或权威资料交叉验证</dd></div> : null}
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}
