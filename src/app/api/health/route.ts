import { getIntegrationState } from "@/lib/env";

export async function GET() {
  return Response.json({
    ok: true,
    service: "frontier-radar",
    integrations: getIntegrationState(),
    checkedAt: new Date().toISOString(),
  });
}
