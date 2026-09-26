"use client";

import { useEffect, useState } from "react";
import { EvidenceBlock } from "./evidence-block";
import { ReadingActions } from "./reading-actions";
import { StatusBadge } from "./status-badge";
import { ComparisonTable, KnowledgeTree, Timeline } from "./visuals";
import { loadLiveItems } from "@/lib/live-data";
import type { KnowledgeItem } from "@/lib/types";

export function LiveItemDetail({ id }: { id: string }) {
  const [item, setItem] = useState<KnowledgeItem | null | undefined>(undefined);
  const [showTranslations, setShowTranslations] = useState(false);
  useEffect(() => { loadLiveItems().then((items) => setItem(items.find((candidate) => candidate.id === id) ?? null)).catch(() => setItem(null)); }, [id]);

  if (item === undefined) return <p className="muted">正在读取知识卡片…</p>;
  if (!item) return <section className="empty-state"><h1>内容不存在</h1><p>这条内容不存在，或尚未完成处理。</p></section>;

  return <article className="detail-page">
    <header className="detail-header">
      <p className="eyebrow">{item.sourceName} · {item.kind.toUpperCase()}</p>
      <h1>{item.title}</h1>
      <div className="detail-meta"><StatusBadge status={item.status} /><time dateTime={item.publishedAt}>{item.publishedAt}</time></div>
      <a className="source-resource-link" href={item.canonicalUrl} target="_blank" rel="noreferrer">↗ 打开原始资源（{item.sourceName}）</a>
      <ReadingActions itemId={item.id} />
    </header>
    {item.status !== "ready" ? <section className="empty-state"><h2>等待处理与证据校验</h2><p>{item.unavailableReasonZh}</p></section> : <>
      <section><h2>AI 摘要</h2><p>{item.summaryZh}</p></section>
      <section><h2>关键论点与原文证据</h2><p className="section-note">引文保留英文原文；可一键显示全部中文翻译。出现已识别的专有名词时，会紧随英文补充中文释义。</p><button className="translation-button" type="button" onClick={() => setShowTranslations((shown) => !shown)} aria-pressed={showTranslations}>{showTranslations ? "收起全部中文翻译" : "显示全部中文翻译"}</button><div className="claim-list">{item.claims?.map((claim, index) => <article className="claim" key={claim.id}><h3>{index + 1}. {claim.titleZh}</h3><p className="claim-type">{claim.id} · {claim.informationType}</p>{claim.evidence.map((evidence) => <EvidenceBlock evidence={evidence} showTranslation={showTranslations} terms={item.terms} key={evidence.id} />)}<p><strong>判断：</strong>{claim.assessmentZh}</p></article>)}</div></section>
      <section><h2>拓展分析</h2><AnalysisGroup title="为什么" rows={item.analysis?.whyZh} /><AnalysisGroup title="横向观点" rows={item.analysis?.horizontalZh} /><AnalysisGroup title="跨学科模式" rows={item.analysis?.crossDisciplinaryZh} /><AnalysisGroup title="现实应用" rows={item.analysis?.applicationZh} /><AnalysisGroup title="对我的意义" rows={item.analysis?.personalZh} /></section>
      <section><h2>可视化结构</h2>{item.visuals?.timeline ? <><h3>时间线</h3><Timeline events={item.visuals.timeline} /></> : null}{item.visuals?.tree ? <><h3>知识树</h3><KnowledgeTree root={item.visuals.tree} /></> : null}{item.visuals?.comparison ? <><h3>对比表</h3><ComparisonTable rows={item.visuals.comparison} /></> : null}</section>
    </>}
  </article>;
}

function AnalysisGroup({ title, rows }: { title: string; rows?: string[] }) {
  if (!rows?.length) return null;
  return <div className="analysis-group"><h3>{title}</h3><ol>{rows.map((row) => <li key={row}>{row}</li>)}</ol></div>;
}
