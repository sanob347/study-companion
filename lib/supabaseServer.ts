import { createClient } from "@supabase/supabase-js";

// Builds a Supabase client that acts AS the calling student — every
// insert/select from this client is still subject to that student's
// row-level security policies. We never use a service-role key here,
// so a bug in this file can't leak another student's data.
export function supabaseAsUser(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    }
  );
}
