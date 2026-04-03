import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { maskEmail } from "@/lib/utils/maskEmail";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?returnTo=/settings");
    }

    const email = user.email ?? "";

    return (
        <div className="mx-auto w-full max-w-2xl space-y-5">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold tracking-tight">设置</h1>
                <Link href="/" className="text-sm text-foreground/70 hover:text-foreground">
                    返回首页
                </Link>
            </div>

            <div className="rounded-2xl border border-foreground/10 bg-background p-5">
                <div className="text-sm text-foreground/70">当前账号</div>
                <div className="mt-2 text-base font-medium">{maskEmail(email)}</div>
                <div className="mt-4">
                    <Link
                        href="/auth/signout"
                        className="inline-flex h-9 items-center rounded-full border border-foreground/15 px-4 text-sm hover:bg-foreground/5"
                    >
                        退出登录
                    </Link>
                </div>
            </div>

            <SettingsClient />
        </div>
    );
}
