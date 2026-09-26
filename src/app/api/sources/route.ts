import { SOURCES } from "@/lib/sources";

export const dynamic = "force-static";

export async function GET() {
  return Response.json({ count: SOURCES.length, sources: SOURCES });
}
