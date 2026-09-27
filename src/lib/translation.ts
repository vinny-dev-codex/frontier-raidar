import { getPrivateEnv } from "./env";
import { ModelResponseError } from "./deepseek";
import { parseModelJson } from "./model-json";

type ModelUsage = { promptTokens: number | null; completionTokens: number | null; totalTokens: number | null };
type EvidenceRow = { id: string; quote: string };

const SYSTEM_PROMPT = `Translate each supplied English source quotation into faithful, natural Simplified Chinese.
Return JSON matching the supplied schema. Preserve every id exactly once. Do not add facts, explanations, quotation marks, or Markdown. Preserve names, numbers, dates, qualifiers, and uncertainty.`;

const translationSchema = {
  type: "object", additionalProperties: false, required: ["translations"],
  properties: { translations: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "translation"], properties: { id: { type: "string" }, translation: { type: "string" } } } } },
} as const;

function usageFrom(payload: { usage?: Record<string, unknown> }): ModelUsage {
  const usage = payload.usage ?? {};
  const number = (value: unknown) => typeof value === "number" ? value : null;
  return { promptTokens: number(usage.input_tokens ?? usage.prompt_tokens), completionTokens: number(usage.output_tokens ?? usage.completion_tokens), totalTokens: number(usage.total_tokens) };
}

function addUsage(total: ModelUsage, next: ModelUsage) {
  total.promptTokens = (total.promptTokens ?? 0) + (next.promptTokens ?? 0);
  total.completionTokens = (total.completionTokens ?? 0) + (next.completionTokens ?? 0);
  total.totalTokens = (total.totalTokens ?? 0) + (next.totalTokens ?? 0);
}

async function translateChunk(evidence: EvidenceRow[], env: ReturnType<typeof getPrivateEnv>) {
  const usage: ModelUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  let lastFormatError = "DeepSeek returned invalid translation JSON.";

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`${env.DEEPSEEK_BASE_URL}/responses`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({
        model: env.DEEPSEEK_MODEL,
        input: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: JSON.stringify({ evidence }) }],
        text: { format: { type: "json_schema", name: "evidence_translations", schema: translationSchema } },
        reasoning: { enabled: false },
        max_output_tokens: 20_000,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: { message?: string }; output_text?: string; output?: { content?: { type?: string; text?: string }[] }[]; usage?: Record<string, unknown> };
    addUsage(usage, usageFrom(payload));
    if (!response.ok) throw new ModelResponseError(`DeepSeek translation request failed: ${payload.error?.message ?? response.status}`, usage);
    const content = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((part) => part.type === "output_text")?.text;
    if (!content) {
      lastFormatError = "DeepSeek returned no translation output.";
      continue;
    }

    try {
      const raw = parseModelJson(content);
      const translations = raw && typeof raw === "object" && Array.isArray((raw as { translations?: unknown }).translations) ? (raw as { translations: unknown[] }).translations : undefined;
      if (!translations) throw new Error("DeepSeek returned an invalid translation shape.");

      const expectedIds = new Set(evidence.map((entry) => entry.id));
      const result = new Map<string, string>();
      for (const entry of translations) {
        if (!entry || typeof entry !== "object") throw new Error("DeepSeek returned an invalid translation entry.");
        const { id, translation } = entry as { id?: unknown; translation?: unknown };
        if (typeof id !== "string" || typeof translation !== "string" || !translation.trim() || !expectedIds.has(id) || result.has(id)) throw new Error("DeepSeek translation IDs do not exactly match the evidence.");
        result.set(id, translation.trim());
      }
      if (result.size !== expectedIds.size) throw new Error("DeepSeek omitted one or more evidence translations.");
      return { translations: result, usage };
    } catch (error) {
      lastFormatError = error instanceof Error ? error.message : "DeepSeek returned invalid translation JSON.";
    }
  }

  throw new ModelResponseError(`${lastFormatError} Retried once; item deferred.`, usage);
}

export async function translateEvidenceBatchToChinese(evidence: EvidenceRow[]) {
  const env = getPrivateEnv();
  if (!env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not configured.");
  const translations = new Map<string, string>();
  const usage: ModelUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  // Six evidence excerpts per request avoids excessive reasoning/output pressure while
  // reducing a 45-excerpt card from 45 calls to eight calls.
  for (let index = 0; index < evidence.length; index += 6) {
    const result = await translateChunk(evidence.slice(index, index + 6), env);
    for (const [id, translation] of result.translations) translations.set(id, translation);
    addUsage(usage, result.usage);
  }
  return { translations, usage, model: env.DEEPSEEK_MODEL };
}
