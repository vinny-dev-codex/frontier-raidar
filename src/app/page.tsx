import { LiveToday } from "@/components/live-today";

export default function TodayPage() {
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">TODAY</p>
        <h1>今日前沿信息</h1>
        <p>用一页掌握 AI、商业、心理学与未来趋势。只在取得可验证原文后生成摘要、证据与分析。</p>
      </section>

      <LiveToday />
    </>
  );
}
