"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LibrarySearch } from "./library-search";
import { loadLiveItems } from "@/lib/live-data";
import type { KnowledgeItem } from "@/lib/types";

export function LiveLibrary() {
  const [items, setItems] = useState<KnowledgeItem[] | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { loadLiveItems().then(({ signedIn, items }) => { setSignedIn(signedIn); setItems(items); }).catch(() => setItems([])); }, []);
  if (items === null) return <p className="muted">正在读取你的个人知识库…</p>;
  if (!signedIn) return <aside className="notice">请先<Link href="/login">登录个人知识库</Link>。</aside>;
  return <LibrarySearch items={items} />;
}
