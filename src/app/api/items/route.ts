import { DEMO_ITEMS } from "@/lib/demo-data";

export const dynamic = "force-static";

export async function GET() {
  return Response.json({ mode: "demo", count: DEMO_ITEMS.length, items: DEMO_ITEMS });
}
