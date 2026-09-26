import { createClient } from "@supabase/supabase-js";
import { getPrivateEnv, getPublicEnv } from "./env";

export function createPublicSupabaseClient() {
  const env = getPublicEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createServiceSupabaseClient() {
  const publicEnv = getPublicEnv();
  const privateEnv = getPrivateEnv();
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !privateEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, privateEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
