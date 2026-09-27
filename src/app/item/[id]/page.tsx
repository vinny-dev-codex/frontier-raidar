import type { Metadata } from "next";
import { LiveItemDetail } from "@/components/live-item-detail";
import { DEMO_ITEMS } from "@/lib/demo-data";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "知识卡片" };

export function generateStaticParams() {
  return DEMO_ITEMS.map(({ id }) => ({ id }));
}

export default async function ItemPage({ params }: Props) {
  return <LiveItemDetail id={(await params).id} />;
}
