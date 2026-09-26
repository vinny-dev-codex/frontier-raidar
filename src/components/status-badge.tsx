import type { ContentStatus } from "@/lib/types";

const labels: Record<ContentStatus, string> = {
  ready: "Ready",
  no_transcript: "暂无找到字幕或文稿",
  no_article_body: "暂未获取原文",
  pending_review: "等待处理",
  processing_failed: "处理失败",
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  return <span className={`status status-${status}`}>{labels[status]}</span>;
}
