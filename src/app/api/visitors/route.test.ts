import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ createServiceSupabaseClient: () => ({ rpc }) }));

afterEach(() => {
  vi.unstubAllEnvs();
  rpc.mockReset();
});

describe("visitor registration", () => {
  it("uses a stable keyed digest for equivalent IPs and returns only the aggregate", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VISITOR_HASH_SECRET", "test-key");
    const visitors = new Set<string>();
    rpc.mockImplementation(async (_name, { visitor_digest }: { visitor_digest: string }) => {
      visitors.add(visitor_digest);
      return { data: visitors.size, error: null };
    });
    async function visit(ip: string) {
      return POST(new Request("https://example.com/api/visitors", {
        method: "POST", headers: { "x-vercel-forwarded-for": ip },
      }));
    }
    expect(await (await visit("2001:db8::1")).json()).toEqual({ count: 1 });
    expect(await (await visit("2001:0db8:0:0:0:0:0:1")).json()).toEqual({ count: 1 });
    expect(await (await visit("192.0.2.1")).json()).toEqual({ count: 2 });
    expect([...visitors].every((digest) => /^[a-f0-9]{64}$/.test(digest))).toBe(true);
  });

  it("does not count an untrusted forwarded address or requests outside production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VISITOR_HASH_SECRET", "test-key");
    expect((await POST(new Request("https://example.com", { headers: { "x-forwarded-for": "192.0.2.1" } }))).status).toBe(503);
    vi.stubEnv("VERCEL_ENV", "preview");
    expect((await POST(new Request("https://example.com", { headers: { "x-vercel-forwarded-for": "192.0.2.1" } }))).status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
  });
});
