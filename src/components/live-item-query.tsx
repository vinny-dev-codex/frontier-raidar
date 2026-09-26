"use client";

import { useSearchParams } from "next/navigation";
import { LiveItemDetail } from "./live-item-detail";

export function LiveItemQuery() {
  const id = useSearchParams().get("id");
  if (!id) return <section className="empty-state"><h1>内容不存在</h1><p>请从知识库中打开一条内容。</p></section>;
  return <LiveItemDetail id={id} />;
}
