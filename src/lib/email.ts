import { getPrivateEnv } from "./env";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export async function sendKnowledgeCardEmail(input: {
  recipient: string;
  title: string;
  summaryZh: string;
  cardUrl: string;
  sourceUrl: string;
}) {
  const env = getPrivateEnv();
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return { status: "skipped" as const, error: "RESEND_API_KEY or RESEND_FROM_EMAIL is not configured." };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: [input.recipient],
      subject: `新知识卡片：${input.title}`,
      html: `<main><h1>${escapeHtml(input.title)}</h1><p>${escapeHtml(input.summaryZh)}</p><p><a href="${escapeHtml(input.cardUrl)}">阅读知识卡片</a></p><p><a href="${escapeHtml(input.sourceUrl)}">打开原始资源</a></p></main>`,
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!response.ok) throw new Error(`Resend request failed with ${response.status}: ${payload.message ?? "unknown error"}`);
  return { status: "sent" as const, providerMessageId: payload.id ?? null };
}
