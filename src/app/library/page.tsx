import type { Metadata } from "next";
import { LiveLibrary } from "@/components/live-library";

export const metadata: Metadata = { title: "知识库" };

export default function LibraryPage() {
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">LIBRARY</p>
        <h1>知识库</h1>
        <p>搜索你已处理并保存的真实知识卡片。</p>
      </section>
      <LiveLibrary />
    </>
  );
}
