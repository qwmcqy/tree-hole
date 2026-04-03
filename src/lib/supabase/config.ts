export function getSupabaseConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error(
            "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        );
    }

    return { url, anonKey };
}

export function getAllowedEmailDomain() {
    const domain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN;
    return domain?.trim() ? domain.trim().toLowerCase() : null;
}

export function getSiteUrl() {
    return (
        process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
        "http://localhost:3000"
    );
}
