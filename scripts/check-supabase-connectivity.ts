const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  throw new Error("Supabase service credentials are not configured.");
}

const supabaseUrl = url;
const serviceKey = key;

async function main() {
  const response = await fetch(`${supabaseUrl}/rest/v1/sources?select=id&limit=1`, {
    headers: {
      apikey: serviceKey,
      accept: "application/json",
    },
  });

  console.log(JSON.stringify({
    ok: response.ok,
    status: response.status,
    serverDate: response.headers.get("date"),
    keyFormat: serviceKey.startsWith("sb_secret_") ? "secret" : "legacy",
  }, null, 2));

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase apikey-only connectivity check failed (${response.status}): ${body.slice(0, 500)}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
