"use client";

import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SettingsClient() {
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    async function updatePassword() {
        setMessage(null);
        if (!password || password.length < 6) {
            setMessage("密码至少 6 位");
            return;
        }
        if (password !== password2) {
            setMessage("两次输入的密码不一致");
            return;
        }

        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            setMessage(error.message);
            return;
        }

        startTransition(() => {
            setPassword("");
            setPassword2("");
            setMessage("密码已更新");
        });
    }

    return (
        <div className="mt-6 rounded-2xl border border-foreground/10 bg-background p-5">
            <h2 className="text-base font-semibold">修改密码</h2>
            <div className="mt-4 space-y-3">
                <input
                    type="password"
                    className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                    placeholder="新密码（至少 6 位）"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                />
                <input
                    type="password"
                    className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                    placeholder="再次输入新密码"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    autoComplete="new-password"
                />
                <button
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-foreground text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
                    onClick={updatePassword}
                    disabled={isPending}
                >
                    更新密码
                </button>
                {message ? <p className="text-sm text-foreground/80">{message}</p> : null}
            </div>
        </div>
    );
}
