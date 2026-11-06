"use client";

import { useEffect, useMemo, useState } from "react";
import type { KnowledgeItem } from "@/lib/types";
import { ItemCard } from "./item-card";
import { useReadingLanguage } from "./reading-language";

export function LibrarySearch({ items }: { items: KnowledgeItem[] }) {
  const locale = useReadingLanguage();
  const en = locale === "en";
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
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

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (source !== "all" && item.sourceName !== source) return false;
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
      return b.publishedAt.localeCompare(a.publishedAt);
    });
  }, [favorites, favoritesOnly, items, query, sort, source]);

  return (
    <div lang={en ? "en" : "zh-CN"}>
      <div className="search-panel home-controls">
        <label>
          {en ? "Search titles, people, companies, terms or topics" : "搜索标题、人物、公司、术语或主题"}
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder={en ? "e.g. Distribution Advantage" : "例如：Distribution Advantage"}
            type="search"
            value={query}
          />
        </label>
        <label>
          {en ? "Source" : "来源"}
          <select onChange={(event) => setSource(event.target.value)} value={source}>
            <option value="all">{en ? "All sources" : "全部来源"}</option>
            {sources.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label>
          {en ? "Sort" : "排序"}
          <select onChange={(event) => setSort(event.target.value)} value={sort}>
            <option value="newest">{en ? "Newest" : "最新发布"}</option>
            <option value="source">{en ? "Source name" : "来源名称"}</option>
          </select>
        </label>
        <label className="checkbox-label">
          <input checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} type="checkbox" />
          {en ? "Saved only" : "只看收藏"}
        </label>
      </div>
      <div className="result-row home-clear-row">
        <button className="text-button" onClick={() => {
          setQuery("");
          setSource("all");
          setFavoritesOnly(false);
          setSort("newest");
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
