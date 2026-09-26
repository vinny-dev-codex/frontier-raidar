import { getPrivateEnv } from "./env";

export async function createSearchEmbedding(text: string) {
  const env = getPrivateEnv();
  if (!env.DASHSCOPE_API_KEY) {
    throw new Error("DASHSCOPE_API_KEY is not configured.");
  }

  const response = await fetch(`${env.DASHSCOPE_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.DASHSCOPE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.QWEN_EMBEDDING_MODEL,
      input: text,
      dimensions: 768,
      encoding_format: "float",
    }),
  });

  if (!response.ok) {
    throw new Error(`Qwen embedding request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as {
    data?: { embedding?: number[] }[];
    usage?: { prompt_tokens?: number; total_tokens?: number };
  };
  const embedding = payload.data?.[0]?.embedding;
  if (!embedding || embedding.length !== 768) {
    throw new Error("Qwen returned an invalid embedding.");
  }
  return {
    embedding,
    usage: {
      promptTokens: payload.usage?.prompt_tokens ?? null,
      totalTokens: payload.usage?.total_tokens ?? null,
    },
  };
}
