import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitReportAction } from "@/app/_actions/treehole";

export default async function ReportPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string; id?: string; returnTo?: string }>;
}) {
    const sp = await searchParams;
    const type = sp.type === "comment" ? "comment" : "post";
    const targetId = (sp.id || "").trim();
    const returnTo = sp.returnTo || "/";

    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: reasons, error } = await supabase
        .from("report_reasons")
        .select("id,label")
        .eq("is_active", true)
        .order("id", { ascending: true });

    return (
        <div className="mx-auto w-full max-w-lg space-y-5">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold tracking-tight">举报{type === "post" ? "帖子" : "评论"}</h1>
                <Link href={returnTo} className="text-sm text-foreground/70 hover:text-foreground">
                    返回
                </Link>
            </div>

            {!user ? (
                <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4 text-sm text-foreground/80">
                    登录后才能举报。
                    <Link
                        href={`/login?returnTo=${encodeURIComponent(`/report?type=${type}&id=${targetId}&returnTo=${encodeURIComponent(returnTo)}`)}`}
                        className="ml-2 underline"
                    >
                        去登录
                    </Link>
                </div>
            ) : null}

            <div className="rounded-2xl border border-foreground/10 bg-background p-5">
                {targetId ? (
                    <p className="text-sm text-foreground/70">举报对象 ID：{targetId}</p>
                ) : (
                    <p className="text-sm text-red-600">缺少举报对象参数</p>
                )}

                {error ? (
                    <p className="mt-3 text-sm text-red-600">加载举报原因失败：{error.message}</p>
                ) : null}

                <form action={submitReportAction} className="mt-4 space-y-4">
                    <input type="hidden" name="targetType" value={type} />
                    <input type="hidden" name="targetId" value={targetId} />
                    <input type="hidden" name="returnTo" value={returnTo} />

                    <div>
                        <label className="text-sm font-medium">举报原因</label>
                        <select
                            name="reasonId"
                            className="mt-2 w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                            required
                            defaultValue={reasons?.[0]?.id}
                        >
                            {reasons?.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">补充说明（可选）</label>
                        <textarea
                            name="note"
                            className="mt-2 min-h-24 w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                            placeholder="简单描述原因，便于管理员处理"
                            maxLength={1000}
                        />
                    </div>

                    <button className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-foreground text-sm font-medium text-background hover:opacity-90 disabled:opacity-60" disabled={!user}>
                        提交举报
                    </button>

                    <p className="text-xs text-foreground/60">
                        提交后会显示“已收到/处理中”的反馈。
                    </p>
                </form>
            </div>
        </div>
    );
}
