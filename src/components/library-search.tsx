"use client";

import { useEffect, useMemo, useState } from "react";
import type { KnowledgeItem } from "@/lib/types";
import { ItemCard } from "./item-card";
import { useReadingLanguage } from "./reading-language";

export function LibrarySearch({ items, home = false }: { items: KnowledgeItem[]; home?: boolean }) {
  const locale = useReadingLanguage();
  const en = locale === "en";
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
    <div lang={en ? "en" : "zh-CN"}>
      <div className={home ? "search-panel home-controls" : "search-panel library-controls"}>
        <label>
          {en ? "Search titles, people, companies, terms or topics" : "搜索标题、人物、公司、术语或主题"}
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder={en ? "e.g. Distribution Advantage" : "例如：Distribution Advantage"}
            type="search"
            value={query}
          />
        </label>
        {!home && <label>
          {en ? "Status" : "状态"}
          <select onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="all">{en ? "All" : "全部"}</option>
            <option value="ready">Ready</option>
            <option value="no_transcript">{en ? "No transcript" : "暂无字幕"}</option>
            <option value="no_article_body">{en ? "No article text" : "暂未获取原文"}</option>
            <option value="pending_review">{en ? "Pending" : "等待处理"}</option>
          </select>
        </label>}
        <label>
          {en ? "Source" : "来源"}
          <select onChange={(event) => setSource(event.target.value)} value={source}>
            <option value="all">{en ? "All sources" : "全部来源"}</option>
            {sources.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        {!home && <label>
          {en ? "Topic" : "主题"}
          <select onChange={(event) => setTopic(event.target.value)} value={topic}>
            <option value="all">{en ? "All topics" : "全部主题"}</option>
            {topics.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>}
        <label>
          {en ? "Sort" : "排序"}
          <select onChange={(event) => setSort(event.target.value)} value={sort}>
            <option value="newest">{en ? "Newest" : "最新发布"}</option>
            <option value="source">{en ? "Source name" : "来源名称"}</option>
            {!home && <option value="status">{en ? "Processing status" : "处理状态"}</option>}
          </select>
        </label>
        <label className="checkbox-label">
          <input checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} type="checkbox" />
          {en ? "Saved only" : "只看收藏"}
        </label>
      </div>
      <div className={home ? "result-row home-clear-row" : "result-row"}>
        {!home && <p className="result-count">{en ? `Results: ${results.length}` : `找到 ${results.length} 条`}</p>}
        <button className="text-button" onClick={() => {
          setQuery("");
          setStatus("all");
          setSource("all");
          setTopic("all");
          setFavoritesOnly(false);
          if (home) setSort("newest");
        }} type="button">{en ? "Clear filters" : "清除筛选"}</button>
      </div>
      <div className="item-list">
        {results.map((item) => (
          <ItemCard item={item} key={item.id} locale={locale} />
        ))}
        {results.length === 0 ? <div className="empty-state"><h2>{en ? "No matching cards" : "没有匹配内容"}</h2><p>{en ? "Clear the filters or try a broader search." : "尝试清除筛选或使用更宽泛的关键词。"}</p></div> : null}
      </div>
    </div>
  );
}
