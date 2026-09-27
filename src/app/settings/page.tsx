import type { Metadata } from "next";
import { LocalDataPanel } from "@/components/local-data-panel";
import { getIntegrationState } from "@/lib/env";

export const metadata: Metadata = { title: "设置" };

export default function SettingsPage() {
  const integrations = getIntegrationState();
  const services = [
    { name: "Supabase", ready: integrations.supabase, purpose: "公开只读知识库、全文和向量搜索" },
    { name: "DeepSeek Flash", ready: integrations.deepseek, purpose: "中文摘要、关键论点与拓展分析" },
    { name: "Qwen Embedding Flash", ready: integrations.qwenEmbedding, purpose: "768 维精选文本语义搜索" },
    { name: "YouTube Data API v3", ready: integrations.youtube, purpose: "官方频道与视频元数据发现" },
  ];

  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">SETTINGS</p>
        <h1>运行设置</h1>
        <p>任何拿到链接的人都可阅读已完成的知识卡片；收藏和已读状态仅保存在当前设备。</p>
      </section>

      <section className="settings-section">
        <div className="section-heading-row"><h2>运行模式</h2><span className={`mode-badge ${integrations.configuredCount === 4 && integrations.supabaseWriter ? "connected" : "demo"}`}>{integrations.configuredCount === 4 && integrations.supabaseWriter ? "Connected" : "Local Demo"}</span></div>
        <div className="service-list">
          {services.map((service) => (
            <div className="service-row" key={service.name}>
              <span aria-hidden className={service.ready ? "service-dot ready" : "service-dot"} />
              <div><strong>{service.name}</strong><p>{service.purpose}</p></div>
              <span>{service.ready ? "已配置" : "未配置"}</span>
            </div>
          ))}
        </div>
        <p className="section-note">密钥只写入 `.env.local` 或部署平台 Secrets，绝不进入浏览器或 Git。</p>
      </section>

      <section className="settings-section">
        <h2>处理规则</h2>
        <div className="policy-grid">
          <article><strong>字幕顺序</strong><p>OS → CC → RSS → PLT → EXT → 经授权的临时音频流转录。转录后立即删除媒体数据。</p></article>
          <article><strong>证据保护</strong><p>AI 只选择 segment ID，引文由程序从原文精确复制。</p></article>
          <article><strong>低存储</strong><p>不永久保存音视频或完整文稿，只保存相关证据和分析结果。</p></article>
          <article><strong>轻量搜索</strong><p>全文搜索覆盖保存文本，向量只处理摘要、论点、证据组和标签。</p></article>
          <article><strong>成本上限</strong><p>每天最多成功处理 5 张知识卡片；未满 5 张时不补足，失败不会自动重试。</p></article>
          <article><strong>额度预警</strong><p>数据库达到 350 MiB 时暂停处理，避免撞到 Free 方案 500 MB 上限。</p></article>
        </div>
      </section>

      <section className="settings-section">
        <h2>当前设备数据</h2>
        <p>演示模式仅把收藏和已读状态保存在浏览器中。可以随时导出或清除。</p>
        <LocalDataPanel />
      </section>

    </>
  );
}
