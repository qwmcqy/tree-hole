import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/_actions/auth";

export async function AppHeader() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <header className="sticky top-0 z-10 border-b border-foreground/10 bg-background/80 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <Link href="/" className="text-base font-semibold tracking-tight">
                        树洞
                    </Link>
                    <nav className="hidden items-center gap-3 text-sm text-foreground/70 sm:flex">
                        <Link href="/" className="hover:text-foreground">
                            首页
                        </Link>
                        <Link href="/new" className="hover:text-foreground">
                            发帖
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/new"
                        className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
                    >
                        发布
                    </Link>
                    {user ? (
                        <>
                            <Link
                                href="/settings"
                                className="hidden h-9 items-center rounded-full border border-foreground/15 px-4 text-sm hover:bg-foreground/5 sm:inline-flex"
                            >
                                设置
                            </Link>
                            <form action={signOutAction}>
                                <button
                                    type="submit"
                                    className="inline-flex h-9 items-center rounded-full border border-foreground/15 px-4 text-sm hover:bg-foreground/5"
                                >
                                    退出
                                </button>
                            </form>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="inline-flex h-9 items-center rounded-full border border-foreground/15 px-4 text-sm hover:bg-foreground/5"
                        >
                            登录
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
