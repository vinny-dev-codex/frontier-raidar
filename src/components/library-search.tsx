"use client";

import { useEffect, useMemo, useState } from "react";
import type { KnowledgeItem } from "@/lib/types";
import { ItemCard } from "./item-card";

export function LibrarySearch({ items }: { items: KnowledgeItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [topic, setTopic] = useState("all");
  const [sort, setSort] = useState("newest");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const refresh = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("frontier-radar-reading-state-v1") ?? "{}") as Record<string, { saved?: boolean }>;
        setFavorites(new Set(Object.entries(stored).filter(([, value]) => value.saved).map(([id]) => id)));
      } catch {
        setFavorites(new Set());
      }
    };
    refresh();
    window.addEventListener("frontier-reading-state", refresh);
    return () => window.removeEventListener("frontier-reading-state", refresh);
  }, []);

  const sources = useMemo(() => [...new Set(items.map((item) => item.sourceName))].sort(), [items]);
  const topics = useMemo(() => [...new Set(items.flatMap((item) => item.tags))].sort(), [items]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (source !== "all" && item.sourceName !== source) return false;
      if (topic !== "all" && !item.tags.includes(topic)) return false;
      if (favoritesOnly && !favorites.has(item.id)) return false;
      if (!normalized) return true;
      const text = [
        item.title,
        item.sourceName,
        item.summaryZh ?? "",
        item.tags.join(" "),
        item.people.join(" "),
        item.companies.join(" "),
        item.terms.map((term) => `${term.zh} ${term.en}`).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(normalized);
    });
    return filtered.toSorted((a, b) => {
      if (sort === "source") return a.sourceName.localeCompare(b.sourceName);
      if (sort === "status") return a.status.localeCompare(b.status);
      return b.publishedAt.localeCompare(a.publishedAt);
    });
  }, [favorites, favoritesOnly, items, query, sort, source, status, topic]);

  return (
    <>
      <div className="search-panel library-controls">
        <label>
          搜索标题、人物、公司、术语或主题
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例如：Distribution Advantage"
            type="search"
            value={query}
          />
        </label>
        <label>
          状态
          <select onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="all">全部</option>
            <option value="ready">Ready</option>
            <option value="no_transcript">暂无字幕</option>
            <option value="no_article_body">暂未获取原文</option>
            <option value="pending_review">等待处理</option>
          </select>
        </label>
        <label>
          来源
          <select onChange={(event) => setSource(event.target.value)} value={source}>
            <option value="all">全部来源</option>
            {sources.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label>
          主题
          <select onChange={(event) => setTopic(event.target.value)} value={topic}>
            <option value="all">全部主题</option>
            {topics.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label>
          排序
          <select onChange={(event) => setSort(event.target.value)} value={sort}>
            <option value="newest">最新发布</option>
            <option value="source">来源名称</option>
            <option value="status">处理状态</option>
          </select>
        </label>
        <label className="checkbox-label">
          <input checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} type="checkbox" />
          只看收藏
        </label>
      </div>
      <div className="result-row"><p className="result-count">找到 {results.length} 条</p><button className="text-button" onClick={() => { setQuery(""); setStatus("all"); setSource("all"); setTopic("all"); setFavoritesOnly(false); }} type="button">清除筛选</button></div>
      <div className="item-list">
        {results.map((item) => (
          <ItemCard item={item} key={item.id} />
        ))}
        {results.length === 0 ? <div className="empty-state"><h2>没有匹配内容</h2><p>尝试清除筛选或使用更宽泛的关键词。</p></div> : null}
      </div>
    </>
  );
}
