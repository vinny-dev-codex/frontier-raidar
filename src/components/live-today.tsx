"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ItemCard } from "./item-card";
import { loadLiveItems } from "@/lib/live-data";
import { SOURCES } from "@/lib/sources";
import type { KnowledgeItem } from "@/lib/types";
import { setReadingLanguage, useReadingLanguage } from "./reading-language";
import { HomeViewCount } from "./home-view-count";

export function LiveToday() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const locale = useReadingLanguage();
  const english = locale === "en";

  useEffect(() => {
    loadLiveItems().then((loaded) => {
      setItems(loaded);
      setState("ready");
    }).catch(() => setState("error"));
  }, []);

  const readyItems = items.filter((item) => item.status === "ready");
  return <div lang={english ? "en" : "zh-CN"}>
    <section className="page-heading today-heading">
      <div><p className="eyebrow">TODAY</p><h1>{english ? "Today’s Frontier Briefing" : "今日前沿信息"}</h1></div>
      <button className="language-button" type="button" lang="zh-CN" onClick={() => setReadingLanguage(english ? "zh" : "en")}>{english ? "切回中文" : "一键翻译英文"}</button>
    </section>
    {state === "loading" ? <p className="muted">{english ? "Loading the library…" : "正在读取知识库…"}</p> : null}
    {state === "error" ? <aside className="setup-message error">{english ? "The library could not load. Please refresh and try again." : "无法读取 Supabase 数据，请刷新后重试。"}</aside> : null}
    <section className="stats-grid" aria-label={english ? "Today’s stats" : "今日状态"}>
      <div><strong>{state === "ready" ? items.length : "—"}</strong><span>{english ? "Discovered and processed" : "已发现与处理"}</span></div>
      <div><strong>{state === "ready" ? readyItems.length : "—"}</strong><span>{english ? "Ready to read" : "可阅读"}</span></div>
      <div><strong>{SOURCES.length}</strong><span>{english ? "Active sources" : "启用来源"}</span></div>
      <HomeViewCount locale={locale} />
    </section>
    {state === "ready" && items.length === 0 ? <aside className="notice">{english ? "No verified cards yet." : "还没有真实知识卡片。内容必须先通过原文与证据校验才会出现。"}</aside> : null}
    <section className="section-block" aria-labelledby="ready-heading">
      <div className="section-heading-row"><div><p className="eyebrow">PRIORITY</p><h2 id="ready-heading">{english ? "Priority Reading" : "今日优先阅读"}</h2></div><Link href="/library">{english ? "View full library →" : "查看全部知识库 →"}</Link></div>
      <div className="item-list">{readyItems.map((item) => <ItemCard item={item} key={item.id} locale={locale} />)}</div>
    </section>
  </div>;
}
