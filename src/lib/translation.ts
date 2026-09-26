import { getPrivateEnv } from "./env";

type ModelUsage = { promptTokens: number | null; completionTokens: number | null; totalTokens: number | null };

const SYSTEM_PROMPT = `Translate the supplied English source quotation into faithful, natural Simplified Chinese.
Return only the Chinese translation. Do not add quotation marks, Markdown, explanations, or information not present in the source. Preserve names, numbers, dates, qualifiers, and uncertainty.`;

function usageFrom(payload: { usage?: Record<string, unknown> }): ModelUsage {
  const usage = payload.usage ?? {};
  const number = (value: unknown) => typeof value === "number" ? value : null;
  return { promptTokens: number(usage.input_tokens ?? usage.prompt_tokens), completionTokens: number(usage.output_tokens ?? usage.completion_tokens), totalTokens: number(usage.total_tokens) };
}

async function translateTextToChinese(sourceText: string) {
  const env = getPrivateEnv();
  if (!env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not configured.");
  const response = await fetch(`${env.DEEPSEEK_BASE_URL}/responses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL,
      input: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: sourceText }],
      max_output_tokens: 4_000,
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: { message?: string }; output_text?: string; output?: { content?: { type?: string; text?: string }[] }[]; usage?: Record<string, unknown> };
  const usage = usageFrom(payload);
  if (!response.ok) throw new Error(`DeepSeek translation request failed: ${payload.error?.message ?? response.status}`);
  const text = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((part) => part.type === "output_text")?.text;
  if (!text?.trim()) throw new Error("DeepSeek returned an empty translation.");
  return { translation: text.trim(), usage, model: env.DEEPSEEK_MODEL };
}

function splitQuote(quote: string) {
  const maximumLength = 800;
  const pieces: string[] = [];
  let current = "";
  for (const sentence of quote.split(/(?<=[.!?])\s+/)) {
    if (sentence.length > maximumLength) {
      if (current) pieces.push(current);
      for (let index = 0; index < sentence.length; index += maximumLength) pieces.push(sentence.slice(index, index + maximumLength));
      current = "";
    } else if (current && current.length + sentence.length + 1 > maximumLength) {
      pieces.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) pieces.push(current);
  return pieces.filter(Boolean);
}

async function translateQuoteToChinese(quote: string) {
  const translations: string[] = [];
  const usage: ModelUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  let model = getPrivateEnv().DEEPSEEK_MODEL;
  for (const piece of splitQuote(quote)) {
    const result = await translateTextToChinese(piece);
    translations.push(result.translation);
    model = result.model;
    usage.promptTokens = (usage.promptTokens ?? 0) + (result.usage.promptTokens ?? 0);
    usage.completionTokens = (usage.completionTokens ?? 0) + (result.usage.completionTokens ?? 0);
    usage.totalTokens = (usage.totalTokens ?? 0) + (result.usage.totalTokens ?? 0);
  }
  return { translation: translations.join("\n"), usage, model };
}

export async function translateEvidenceBatchToChinese(evidence: { id: string; quote: string }[]) {
  const translations = new Map<string, string>();
  const usage: ModelUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  let model = getPrivateEnv().DEEPSEEK_MODEL;

  for (const evidenceRow of evidence) {
    const result = await translateQuoteToChinese(evidenceRow.quote);
    translations.set(evidenceRow.id, result.translation);
    model = result.model;
    usage.promptTokens = (usage.promptTokens ?? 0) + (result.usage.promptTokens ?? 0);
    usage.completionTokens = (usage.completionTokens ?? 0) + (result.usage.completionTokens ?? 0);
    usage.totalTokens = (usage.totalTokens ?? 0) + (result.usage.totalTokens ?? 0);
  }
  return { translations, usage, model };
}
