"use client";

import { useEffect, useState } from "react";
import { LibrarySearch } from "./library-search";
import { loadLiveItems } from "@/lib/live-data";
import type { KnowledgeItem } from "@/lib/types";

export function LiveLibrary() {
  const [items, setItems] = useState<KnowledgeItem[] | null>(null);
  useEffect(() => { loadLiveItems().then(setItems).catch(() => setItems([])); }, []);
  if (items === null) return <p className="muted">正在读取知识库…</p>;
  return <LibrarySearch items={items} />;
}
