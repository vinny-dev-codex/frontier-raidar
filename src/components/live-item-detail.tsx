"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { EvidenceBlock } from "./evidence-block";
import { ReadingActions } from "./reading-actions";
import { StatusBadge } from "./status-badge";
import { ComparisonTable, KnowledgeTree, Timeline } from "./visuals";
import { loadLiveItems } from "@/lib/live-data";
import type { KnowledgeItem } from "@/lib/types";

type Locale = "zh" | "en";
const LANGUAGE_KEY = "frontier-radar-card-language-v1";

const copy = {
  zh: {
    loading: "正在读取知识卡片…", missingTitle: "内容不存在", missingBody: "这条内容不存在，或尚未完成处理。",
    source: "打开原始资源", waiting: "等待处理与证据校验", summary: "AI 摘要", claims: "关键论点与原文证据",
    evidenceNote: "引文保留英文原文；可一键显示全部中文翻译。出现已识别的专有名词时，会紧随英文补充中文释义。",
    showTranslations: "显示全部中文翻译", hideTranslations: "收起全部中文翻译", assessment: "判断：", analysis: "拓展分析",
    why: "为什么", horizontal: "横向观点", cross: "跨学科模式", application: "现实应用", personal: "对我的意义",
    visuals: "可视化结构", timeline: "时间线", tree: "知识树", comparison: "对比表", switchLanguage: "English",
  },
  en: {
    loading: "Loading knowledge card…", missingTitle: "Content unavailable", missingBody: "This item does not exist or has not finished processing.",
    source: "Open original source", waiting: "Awaiting processing and evidence verification", summary: "AI Summary", claims: "Key Claims and Source Evidence",
    evidenceNote: "Source quotations remain in their exact original English. Evidence identifiers and links are unchanged.",
    showTranslations: "", hideTranslations: "", assessment: "Assessment: ", analysis: "Extended Analysis",
    why: "Why It Matters", horizontal: "Related Perspectives", cross: "Cross-disciplinary Patterns", application: "Practical Applications", personal: "What It Means for Me",
    visuals: "Visual Structure", timeline: "Timeline", tree: "Knowledge Tree", comparison: "Comparison", switchLanguage: "中文",
  },
} as const;

function hasCompleteEnglish(item: KnowledgeItem) {
  return Boolean(item.english
    && item.english.summary.trim()
    && item.english.claims.length === (item.claims?.length ?? 0));
}

function subscribeToLanguage(callback: () => void) {
  window.addEventListener("frontier-language-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("frontier-language-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function storedLanguage(): Locale {
  return localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "zh";
}

export function LiveItemDetail({ id }: { id: string }) {
  const [item, setItem] = useState<KnowledgeItem | null | undefined>(undefined);
  const [showTranslations, setShowTranslations] = useState(false);
  const preferredLocale = useSyncExternalStore<Locale>(subscribeToLanguage, storedLanguage, () => "zh");

  useEffect(() => {
    loadLiveItems().then((items) => setItem(items.find((candidate) => candidate.id === id) ?? null)).catch(() => setItem(null));
  }, [id]);

  if (item === undefined) return <p className="muted">{copy[preferredLocale].loading}</p>;
  if (!item) return <section className="empty-state"><h1>{copy[preferredLocale].missingTitle}</h1><p>{copy[preferredLocale].missingBody}</p></section>;

  const englishAvailable = hasCompleteEnglish(item);
  const activeLocale: Locale = preferredLocale === "en" && englishAvailable ? "en" : "zh";
  const text = copy[activeLocale];
  const englishClaims = new Map(item.english?.claims.map((claim) => [claim.id, claim]));
  const analysisRows = activeLocale === "en" ? {
    why: item.english?.analysis.why,
    horizontal: item.english?.analysis.horizontal,
    cross: item.english?.analysis.crossDisciplinary,
    application: item.english?.analysis.application,
    personal: item.english?.analysis.personal,
  } : {
    why: item.analysis?.whyZh,
    horizontal: item.analysis?.horizontalZh,
    cross: item.analysis?.crossDisciplinaryZh,
    application: item.analysis?.applicationZh,
    personal: item.analysis?.personalZh,
  };
  const visuals = activeLocale === "en" ? item.english?.visuals : item.visuals;

  function toggleLanguage() {
    const next: Locale = activeLocale === "zh" ? "en" : "zh";
    setShowTranslations(false);
    localStorage.setItem(LANGUAGE_KEY, next);
    window.dispatchEvent(new CustomEvent("frontier-language-change"));
  }

  return <article className="detail-page" lang={activeLocale === "en" ? "en" : "zh-CN"}>
    <header className="detail-header">
      <div className="detail-language-row">
        <p className="eyebrow">{item.sourceName} · {item.kind.toUpperCase()}</p>
        {englishAvailable ? <button className="language-button" type="button" onClick={toggleLanguage} aria-label={activeLocale === "zh" ? "Switch this card to English" : "将此卡片切换为中文"}>🌐 {text.switchLanguage}</button> : null}
      </div>
      <h1>{item.title}</h1>
      <div className="detail-meta"><StatusBadge status={item.status} locale={activeLocale} /><time dateTime={item.publishedAt}>{item.publishedAt}</time></div>
      <a className="source-resource-link" href={item.canonicalUrl} target="_blank" rel="noreferrer">↗ {text.source}{activeLocale === "en" ? ` (${item.sourceName})` : `（${item.sourceName}）`}</a>
      <ReadingActions itemId={item.id} locale={activeLocale} />
    </header>
    {item.status !== "ready" ? <section className="empty-state"><h2>{text.waiting}</h2><p>{item.unavailableReasonZh}</p></section> : <>
      <section><h2>{text.summary}</h2><p>{activeLocale === "en" ? item.english?.summary : item.summaryZh}</p></section>
      <section><h2>{text.claims}</h2><p className="section-note">{text.evidenceNote}</p>{activeLocale === "zh" ? <button className="translation-button" type="button" onClick={() => setShowTranslations((shown) => !shown)} aria-pressed={showTranslations}>{showTranslations ? text.hideTranslations : text.showTranslations}</button> : null}<div className="claim-list">{item.claims?.map((claim, index) => {
        const englishClaim = englishClaims.get(claim.id);
        return <article className="claim" key={claim.id}><h3>{index + 1}. {activeLocale === "en" ? englishClaim?.title : claim.titleZh}</h3><p className="claim-type">{claim.id} · {claim.informationType}</p>{claim.evidence.map((evidence) => <EvidenceBlock evidence={evidence} showTranslation={activeLocale === "zh" && showTranslations} showInlineTermTranslations={activeLocale === "zh"} terms={item.terms} key={evidence.id} />)}<p><strong>{text.assessment}</strong>{activeLocale === "en" ? englishClaim?.assessment : claim.assessmentZh}</p></article>;
      })}</div></section>
      <section><h2>{text.analysis}</h2><AnalysisGroup title={text.why} rows={analysisRows.why} /><AnalysisGroup title={text.horizontal} rows={analysisRows.horizontal} /><AnalysisGroup title={text.cross} rows={analysisRows.cross} /><AnalysisGroup title={text.application} rows={analysisRows.application} /><AnalysisGroup title={text.personal} rows={analysisRows.personal} /></section>
      <section><h2>{text.visuals}</h2>{visuals?.timeline ? <><h3>{text.timeline}</h3><Timeline events={visuals.timeline} locale={activeLocale} /></> : null}{visuals?.tree ? <><h3>{text.tree}</h3><KnowledgeTree root={visuals.tree} locale={activeLocale} /></> : null}{visuals?.comparison ? <><h3>{text.comparison}</h3><ComparisonTable rows={visuals.comparison} locale={activeLocale} /></> : null}</section>
    </>}
  </article>;
}

function AnalysisGroup({ title, rows }: { title: string; rows?: string[] }) {
  if (!rows?.length) return null;
  return <div className="analysis-group"><h3>{title}</h3><ol>{rows.map((row) => <li key={row}>{row}</li>)}</ol></div>;
}
