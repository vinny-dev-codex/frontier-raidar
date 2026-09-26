import { getPrivateEnv } from "../src/lib/env";
import { createServiceSupabaseClient } from "../src/lib/supabase";

async function main() {
  const readerEmail = process.env.READER_EMAIL?.trim().toLocaleLowerCase();
  if (!readerEmail) throw new Error("Set READER_EMAIL to the family member's verified login email.");
  const env = getPrivateEnv();
  const database = createServiceSupabaseClient();
  if (!database) throw new Error("Supabase service credentials are not configured.");

  const { data, error } = await database.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (error) throw error;
  const owner = env.OWNER_EMAIL
    ? data.users.find((user) => user.email?.toLocaleLowerCase() === env.OWNER_EMAIL?.toLocaleLowerCase())
    : data.users.length === 1 ? data.users[0] : undefined;
  const reader = data.users.find((user) => user.email?.toLocaleLowerCase() === readerEmail);
  if (!owner) throw new Error("Set OWNER_EMAIL when more than one user exists.");
  if (!reader) throw new Error("The reader must sign in once before access can be granted.");

  const { error: shareError } = await database.from("library_members").upsert(
    { owner_id: owner.id, member_id: reader.id, role: "reader" },
    { onConflict: "owner_id,member_id" },
  );
  if (shareError) throw shareError;
  console.log(JSON.stringify({ ok: true, role: "reader" }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
