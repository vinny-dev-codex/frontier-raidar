import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

export const runtime = "nodejs";

const setupSchema = z.object({
  supabaseUrl: z.string().url(),
  supabaseAnonKey: z.string().min(1),
  supabaseServiceRoleKey: z.string().min(1),
  deepseekApiKey: z.string().min(1),
  dashscopeApiKey: z.string().min(1),
  youtubeApiKey: z.string().min(1),
}).superRefine((values, context) => {
  for (const [name, value] of Object.entries(values)) {
    if (/[\r\n]/.test(value)) {
      context.addIssue({ code: "custom", message: `${name} contains an invalid line break.` });
    }
  }
});

const managedKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DEEPSEEK_API_KEY",
  "DASHSCOPE_API_KEY",
  "YOUTUBE_API_KEY",
] as const;

type SetupValues = z.infer<typeof setupSchema>;

function isLocalDevelopmentRequest(request: Request) {
  const hostname = new URL(request.url).hostname;
  return process.env.NODE_ENV === "development" && ["localhost", "127.0.0.1", "::1"].includes(hostname);
}

function renderValue(value: string) {
  return JSON.stringify(value);
}

function managedLines(values: SetupValues) {
  return {
    NEXT_PUBLIC_SUPABASE_URL: renderValue(values.supabaseUrl),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: renderValue(values.supabaseAnonKey),
    SUPABASE_SERVICE_ROLE_KEY: renderValue(values.supabaseServiceRoleKey),
    DEEPSEEK_API_KEY: renderValue(values.deepseekApiKey),
    DASHSCOPE_API_KEY: renderValue(values.dashscopeApiKey),
    YOUTUBE_API_KEY: renderValue(values.youtubeApiKey),
  };
}

function mergeLocalEnv(existing: string, values: SetupValues) {
  const replacement = managedLines(values);
  const remaining = new Set<(typeof managedKeys)[number]>(managedKeys);
  const lines = existing.split(/\r?\n/).map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    const key = match?.[1] as (typeof managedKeys)[number] | undefined;
    if (!key || !managedKeys.includes(key)) return line;

    remaining.delete(key);
    return `${key}=${replacement[key]}`;
  });

  if (remaining.size > 0) {
    if (lines.length > 0 && lines.at(-1) !== "") lines.push("");
    for (const key of remaining) lines.push(`${key}=${replacement[key]}`);
  }

  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

export async function POST(request: Request) {
  if (!isLocalDevelopmentRequest(request)) {
    return Response.json({ error: "This local setup endpoint is only available on localhost during development." }, { status: 403 });
  }

  const parsed = setupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "请检查全部字段是否已填写，Supabase URL 必须是完整的 https 地址。" }, { status: 400 });
  }

  const envPath = join(process.cwd(), ".env.local");
  const current = await readFile(envPath, "utf8").catch(() => "");
  const content = mergeLocalEnv(current, parsed.data);
  await writeFile(envPath, content, { encoding: "utf8", mode: 0o600 });

  return Response.json({
    ok: true,
    saved: managedKeys,
    restartRequired: true,
  });
}
