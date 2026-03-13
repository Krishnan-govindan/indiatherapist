import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error('Missing env: SUPABASE_URL');
if (!supabaseServiceRoleKey) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY');

/**
 * Regular client — respects RLS policies.
 * Use for any operation that should be scoped to a user's permissions.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey ?? supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

/**
 * Admin client — uses the service role key, bypasses RLS.
 * Use only in server-side API routes, webhooks, and cron jobs.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
