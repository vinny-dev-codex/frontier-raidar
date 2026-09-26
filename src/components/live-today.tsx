"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ItemCard } from "./item-card";
import { loadLiveItems } from "@/lib/live-data";
import type { KnowledgeItem } from "@/lib/types";

export function LiveToday() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    loadLiveItems().then((loaded) => {
      setItems(loaded);
      setState("ready");
    }).catch(() => setState("error"));
  }, []);

  if (state === "loading") return <p className="muted">正在读取知识库…</p>;
  if (state === "error") return <aside className="setup-message error">无法读取 Supabase 数据，请刷新后重试。</aside>;

  const readyItems = items.filter((item) => item.status === "ready");
  return <>
    <section className="stats-grid" aria-label="今日状态">
      <div><strong>{items.length}</strong><span>已发现与处理</span></div>
      <div><strong>{readyItems.length}</strong><span>可阅读</span></div>
      <div><strong>12</strong><span>启用来源</span></div>
      <div><strong>4/4</strong><span>外部服务已连接</span></div>
    </section>
    {items.length === 0 ? <aside className="notice">还没有真实知识卡片。内容必须先通过原文与证据校验才会出现。</aside> : null}
    <section className="section-block" aria-labelledby="ready-heading">
      <div className="section-heading-row"><div><p className="eyebrow">PRIORITY</p><h2 id="ready-heading">今日优先阅读</h2></div><Link href="/library">查看全部知识库 →</Link></div>
      <div className="item-list">{readyItems.map((item) => <ItemCard item={item} key={item.id} />)}</div>
    </section>
  </>;
}
