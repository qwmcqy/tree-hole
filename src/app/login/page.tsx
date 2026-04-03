"use client";

import { Suspense, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="mx-auto w-full max-w-md">
                    <h1 className="text-2xl font-semibold tracking-tight">登录</h1>
                    <div className="mt-6 rounded-2xl border border-foreground/10 bg-background p-5">
                        <p className="text-sm text-foreground/70">加载中…</p>
                    </div>
                </div>
            }
        >
            <LoginInner />
        </Suspense>
    );
}

function LoginInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get("returnTo") || "/";

    const [email, setEmail] = useState("");
    const [mode, setMode] = useState<"link" | "password">("link");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);
    const [isPending, startTransition] = useTransition();

    const allowedDomain = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "")
        .trim()
        .toLowerCase();

    const domainError = useMemo(() => {
        if (!allowedDomain) return null;
        const lower = email.trim().toLowerCase();
        if (!lower) return null;
        if (!lower.endsWith(`@${allowedDomain}`)) {
            return `仅支持 ${allowedDomain} 邮箱登录`;
        }
        return null;
    }, [allowedDomain, email]);

    async function sendLink() {
        setMessage(null);
        if (isBusy) return;

        const normalized = email.trim().toLowerCase();
        if (!isValidEmail(normalized)) {
            setMessage("请输入有效邮箱");
            return;
        }
        if (domainError) {
            setMessage(domainError);
            return;
        }

        try {
            setIsBusy(true);

            const supabase = createSupabaseBrowserClient();
            const siteUrl =
                typeof window !== "undefined"
                    ? window.location.origin
                    : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
            const { error } = await supabase.auth.signInWithOtp({
                email: normalized,
                options: {
                    shouldCreateUser: true,
                    emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(returnTo)}`,
                },
            });

            if (error) {
                const msg = (error.message || "").toLowerCase();
                if (msg.includes("rate limit") || msg.includes("too many")) {
                    setMessage(
                        "邮件发送太频繁，触发了 Supabase 的限流：请稍等一会再试，或在 Supabase 配置自定义 SMTP（生产建议）。",
                    );
                    return;
                }

                setMessage(error.message);
                return;
            }

            setMessage(
                "登录链接已发送：请到邮箱中点击邮件里的 Confirm / 登录链接完成登录（首次注册可能显示 Confirm your signup）。",
            );
        } finally {
            setIsBusy(false);
        }
    }

    async function signInWithPassword() {
        setMessage(null);
        if (isBusy) return;

        const normalized = email.trim().toLowerCase();
        if (!isValidEmail(normalized)) {
            setMessage("请输入有效邮箱");
            return;
        }
        if (domainError) {
            setMessage(domainError);
            return;
        }

        const pass = password;
        if (!pass || pass.length < 6) {
            setMessage("请输入密码（至少 6 位）");
            return;
        }

        try {
            setIsBusy(true);
            const supabase = createSupabaseBrowserClient();
            const { error } = await supabase.auth.signInWithPassword({
                email: normalized,
                password: pass,
            });

            if (error) {
                setMessage(
                    "邮箱或密码错误，或该账号尚未设置密码：请先用邮箱链接登录，然后到「设置」里设置密码。",
                );
                return;
            }

            startTransition(() => {
                router.replace(returnTo);
                router.refresh();
            });
        } finally {
            setIsBusy(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-md">
            <h1 className="text-2xl font-semibold tracking-tight">登录</h1>
            <p className="mt-2 text-sm text-foreground/70">
                仅通过验证的本校用户可发帖、评论、举报。
            </p>

            <div className="mt-6 rounded-2xl border border-foreground/10 bg-background p-5">
                <label className="text-sm font-medium">校园邮箱</label>
                <input
                    className="mt-2 w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={allowedDomain ? `name@${allowedDomain}` : "name@school.edu.cn"}
                    inputMode="email"
                    autoComplete="email"
                    disabled={isBusy || isPending}
                />
                {domainError ? (
                    <p className="mt-2 text-sm text-red-600">{domainError}</p>
                ) : null}

                {mode === "link" ? (
                    <>
                        <button
                            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-foreground text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
                            onClick={sendLink}
                            disabled={isBusy || isPending}
                        >
                            发送登录链接
                        </button>

                        <button
                            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-foreground/15 text-sm hover:bg-foreground/5 disabled:opacity-60"
                            onClick={() => {
                                setMode("password");
                                setMessage(null);
                            }}
                            disabled={isBusy || isPending}
                        >
                            我有密码，用密码登录
                        </button>
                    </>
                ) : (
                    <>
                        <label className="mt-4 block text-sm font-medium">密码</label>
                        <input
                            type="password"
                            className="mt-2 w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入密码"
                            autoComplete="current-password"
                            disabled={isBusy || isPending}
                        />
                        <button
                            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-foreground text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
                            onClick={signInWithPassword}
                            disabled={isBusy || isPending}
                        >
                            登录
                        </button>
                        <button
                            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-foreground/15 text-sm hover:bg-foreground/5 disabled:opacity-60"
                            onClick={() => {
                                setMode("link");
                                setPassword("");
                                setMessage(null);
                            }}
                            disabled={isBusy || isPending}
                        >
                            没有密码，用邮箱链接登录
                        </button>
                    </>
                )}

                {message ? <p className="mt-3 text-sm text-foreground/80">{message}</p> : null}
            </div>
        </div>
    );
}
