import type { Metadata } from "next";
import { LiveItemDetail } from "@/components/live-item-detail";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "知识卡片" };

export default async function ItemPage({ params }: Props) {
  return <LiveItemDetail id={(await params).id} />;
}
