import { createServiceSupabaseClient } from "@/lib/supabase";

function reply(count: number | null, status = 200) {
  return Response.json({ count }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return reply(null, 403);
  if (process.env.HOME_VIEW_COUNT_ENABLED !== "true") return reply(null, 503);
  const database = createServiceSupabaseClient();
  if (!database) return reply(null, 503);
  const { data, error } = await database.rpc("record_homepage_view");
  if (error || typeof data !== "number") return reply(null, 503);
  return reply(data);
}
