import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client — bypasses Row Level Security.
 * NEVER expose this to the browser. Only use in server-side API routes.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
