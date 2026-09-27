import { getPrivateEnv } from "./env";

export async function createSearchEmbeddings(texts: string[]) {
  const env = getPrivateEnv();
  if (!env.DASHSCOPE_API_KEY) throw new Error("DASHSCOPE_API_KEY is not configured.");
  if (texts.length === 0) return { embeddings: [], usage: { promptTokens: 0, totalTokens: 0 } };

  const response = await fetch(`${env.DASHSCOPE_BASE_URL}/embeddings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.DASHSCOPE_API_KEY}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(120_000),
    body: JSON.stringify({
      model: env.QWEN_EMBEDDING_MODEL,
      input: texts,
      dimensions: 768,
      encoding_format: "float",
    }),
  });

  if (!response.ok) throw new Error(`Qwen embedding request failed with ${response.status}.`);
  const payload = (await response.json()) as {
    data?: { embedding?: number[]; index?: number }[];
    usage?: { prompt_tokens?: number; total_tokens?: number };
  };
  const embeddings = (payload.data ?? [])
    .toSorted((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((entry) => entry.embedding);
  if (embeddings.length !== texts.length || embeddings.some((embedding) => !embedding || embedding.length !== 768)) {
    throw new Error("Qwen returned invalid embeddings.");
  }
  return {
    embeddings: embeddings as number[][],
    usage: {
      promptTokens: payload.usage?.prompt_tokens ?? null,
      totalTokens: payload.usage?.total_tokens ?? null,
    },
  };
}

export async function createSearchEmbedding(text: string) {
  const result = await createSearchEmbeddings([text]);
  return { embedding: result.embeddings[0], usage: result.usage };
}
