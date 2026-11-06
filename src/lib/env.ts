import { z } from "zod";

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(blankToUndefined, z.string().min(1).optional());
const optionalUrl = z.preprocess(blankToUndefined, z.string().url().optional());
const optionalEmail = z.preprocess(blankToUndefined, z.string().email().optional());
const defaultString = (value: string) => z.preprocess(blankToUndefined, z.string().default(value));
const defaultUrl = (value: string) => z.preprocess(blankToUndefined, z.string().url().default(value));

const privateSchema = z.object({
  DEEPSEEK_API_KEY: optionalString,
  DEEPSEEK_BASE_URL: defaultUrl("https://api.deepseek.com"),
  DEEPSEEK_MODEL: defaultString("deepseek-flash"),
  DASHSCOPE_API_KEY: optionalString,
  DASHSCOPE_BASE_URL: defaultUrl("https://dashscope.aliyuncs.com/compatible-mode/v1"),
  QWEN_EMBEDDING_MODEL: defaultString("qwen3.7-text-embedding-flash"),
  YOUTUBE_API_KEY: optionalString,
  YOUTUBE_API_BASE_URL: defaultUrl("https://www.googleapis.com/youtube/v3"),
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  OWNER_EMAIL: optionalEmail,
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
});

export function getPrivateEnv() {
  return privateSchema.parse({
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL,
    DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
    DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY,
    DASHSCOPE_BASE_URL: process.env.DASHSCOPE_BASE_URL,
    QWEN_EMBEDDING_MODEL: process.env.QWEN_EMBEDDING_MODEL,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    YOUTUBE_API_BASE_URL: process.env.YOUTUBE_API_BASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OWNER_EMAIL: process.env.OWNER_EMAIL,
  });
}

export function getPublicEnv() {
  return publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function getIntegrationState() {
  const privateEnv = getPrivateEnv();
  const publicEnv = getPublicEnv();
  const state = {
    deepseek: Boolean(privateEnv.DEEPSEEK_API_KEY),
    qwenEmbedding: Boolean(privateEnv.DASHSCOPE_API_KEY),
    youtube: Boolean(privateEnv.YOUTUBE_API_KEY),
    supabase: Boolean(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    supabaseWriter: Boolean(privateEnv.SUPABASE_SERVICE_ROLE_KEY),
  };
  return {
    ...state,
    configuredCount: [state.deepseek, state.qwenEmbedding, state.supabase, state.youtube].filter(Boolean)
      .length,
  };
}
