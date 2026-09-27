import { Suspense } from "react";
import { LiveItemQuery } from "@/components/live-item-query";

export default function ItemQueryPage() {
  return <Suspense fallback={<p className="muted">正在读取知识卡片…</p>}><LiveItemQuery /></Suspense>;
}
