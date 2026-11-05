"use client";

import { useEffect, useState } from "react";
import { LibrarySearch } from "./library-search";
import { useReadingLanguage } from "./reading-language";
import { loadLiveItems } from "@/lib/live-data";
import type { KnowledgeItem } from "@/lib/types";

export function LiveLibrary() {
  const en = useReadingLanguage() === "en";
  const [items, setItems] = useState<KnowledgeItem[] | null>(null);
  useEffect(() => { loadLiveItems().then(setItems).catch(() => setItems([])); }, []);
  return <div lang={en ? "en" : "zh-CN"}>
    <section className="page-heading">
      <p className="eyebrow">LIBRARY</p>
      <h1>{en ? "Library" : "知识库"}</h1>
      <p>{en ? "Search processed knowledge cards and revisit your saved cards." : "搜索你已处理并保存的真实知识卡片。"}</p>
    </section>
    {items === null ? <p className="muted">{en ? "Loading the library…" : "正在读取知识库…"}</p> : <LibrarySearch items={items} />}
  </div>;
}
