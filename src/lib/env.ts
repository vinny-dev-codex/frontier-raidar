import { z } from "zod";

const privateSchema = z.object({
  DEEPSEEK_API_KEY: z.string().min(1).optional(),
  DEEPSEEK_BASE_URL: z.string().url().default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.string().default("deepseek-flash"),
  DASHSCOPE_API_KEY: z.string().min(1).optional(),
  DASHSCOPE_BASE_URL: z
    .string()
    .url()
    .default("https://dashscope.aliyuncs.com/compatible-mode/v1"),
  QWEN_EMBEDDING_MODEL: z.string().default("qwen3.7-text-embedding-flash"),
  YOUTUBE_API_KEY: z.string().min(1).optional(),
  YOUTUBE_API_BASE_URL: z.string().url().default("https://www.googleapis.com/youtube/v3"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  OWNER_EMAIL: z.string().email().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

export function getPrivateEnv() {
  return privateSchema.parse(process.env);
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
