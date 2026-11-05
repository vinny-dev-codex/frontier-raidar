import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createServiceSupabaseClient } from "@/lib/supabase";

function reply(count: number | null, status = 200) {
  return Response.json({ count }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return reply(null, 403);
  const secret = process.env.VISITOR_HASH_SECRET;
  const ip = request.headers.get("x-vercel-forwarded-for")?.trim() ?? "";
  const version = isIP(ip);
  if (process.env.VERCEL_ENV !== "production" || !secret || !version) return reply(null, 503);
  const normalized = version === 6 ? new URL(`http://[${ip}]`).hostname : ip;
  const digest = createHmac("sha256", secret).update(normalized).digest("hex");
  const database = createServiceSupabaseClient();
  if (!database) return reply(null, 503);
  const { data, error } = await database.rpc("record_unique_visitor", { visitor_digest: digest });
  if (error || typeof data !== "number") return reply(null, 503);
  return reply(data);
}
