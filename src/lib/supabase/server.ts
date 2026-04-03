import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

export async function createSupabaseServerClient() {
    const { url, anonKey } = getSupabaseConfig();
    const cookieStore = await cookies();

    return createServerClient(url, anonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                } catch {
                    // 在某些只读上下文（纯 Server Component render）下无法 set cookie。
                    // 这种情况下会话刷新交给 middleware 处理即可。
                }
            },
        },
    });
}
