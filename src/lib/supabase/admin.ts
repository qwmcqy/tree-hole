import "server-only";

import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

    if (!url) {
        throw new Error(
            "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL for admin client.",
        );
    }

    if (!serviceRoleKey) {
        throw new Error(
            "Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY in server env.",
        );
    }

    return createClient(url, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
}
