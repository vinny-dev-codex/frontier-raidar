import type { ContentStatus } from "@/lib/types";

const labels: Record<ContentStatus, string> = {
  ready: "Ready",
  no_transcript: "暂无找到字幕或文稿",
  no_article_body: "暂未获取原文",
  pending_review: "等待处理",
  processing_failed: "处理失败",
};

const englishLabels: Record<ContentStatus, string> = {
  ready: "Ready",
  no_transcript: "No transcript found",
  no_article_body: "Article unavailable",
  pending_review: "Pending",
  processing_failed: "Processing failed",
};

export function StatusBadge({ status, locale = "zh" }: { status: ContentStatus; locale?: "zh" | "en" }) {
  return <span className={`status status-${status}`}>{locale === "en" ? englishLabels[status] : labels[status]}</span>;
}
