import Link from "next/link";

import {
    banUserAction,
    deleteCommentAction,
    markReportHandledAction,
} from "@/app/_actions/adminReports";
import { isAdminUser } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ReportRow = {
    id: number;
    reporter_user_id: string;
    post_id: number | null;
    comment_id: number | null;
    reason_id: number;
    note: string | null;
    status: string;
    created_at: string;
    handled_at: string | null;
};

type ReasonRow = { id: number; label: string };

type PostRow = {
    id: number;
    title: string | null;
    status: string;
    author_user_id: string;
};

type CommentRow = {
    id: number;
    post_id: number;
    body: string;
    status: string;
    author_user_id: string;
};

function formatTime(iso: string) {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

export default async function AdminReportsPage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="rounded-2xl border border-foreground/10 bg-background p-6">
                <div className="text-lg font-medium">需要登录</div>
                <p className="mt-2 text-sm text-foreground/70">登录后才能访问管理后台。</p>
                <Link
                    className="mt-4 inline-flex h-10 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
                    href={`/login?returnTo=${encodeURIComponent("/admin/reports")}`}
                >
                    去登录
                </Link>
            </div>
        );
    }

    if (!isAdminUser(user.id)) {
        return (
            <div className="rounded-2xl border border-foreground/10 bg-background p-6">
                <div className="text-lg font-medium">无权限</div>
                <p className="mt-2 text-sm text-foreground/70">
                    你的账号未被配置为管理员。
                </p>
            </div>
        );
    }

    let admin;
    try {
        admin = createSupabaseAdminClient();
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return (
            <div className="rounded-2xl border border-foreground/10 bg-background p-6">
                <div className="text-lg font-medium">后台未配置</div>
                <p className="mt-2 text-sm text-foreground/70">{msg}</p>
                <p className="mt-2 text-sm text-foreground/70">
                    需要在服务端环境变量里设置 <code>SUPABASE_SERVICE_ROLE_KEY</code>。
                </p>
            </div>
        );
    }

    const [reportsRes, reasonsRes] = await Promise.all([
        admin
            .from("reports")
            .select(
                "id,reporter_user_id,post_id,comment_id,reason_id,note,status,created_at,handled_at",
            )
            .order("created_at", { ascending: false })
            .limit(100),
        admin.from("report_reasons").select("id,label"),
    ]);

    if (reportsRes.error) {
        return (
            <div className="rounded-2xl border border-foreground/10 bg-background p-6">
                <div className="text-lg font-medium">加载失败</div>
                <p className="mt-2 text-sm text-foreground/70">
                    {reportsRes.error.message}
                </p>
            </div>
        );
    }

    if (reasonsRes.error) {
        return (
            <div className="rounded-2xl border border-foreground/10 bg-background p-6">
                <div className="text-lg font-medium">加载失败</div>
                <p className="mt-2 text-sm text-foreground/70">
                    {reasonsRes.error.message}
                </p>
            </div>
        );
    }

    const reports = (reportsRes.data ?? []) as unknown as ReportRow[];
    const reasons = (reasonsRes.data ?? []) as unknown as ReasonRow[];
    const reasonMap = new Map(reasons.map((r) => [r.id, r.label]));

    const postIds = Array.from(
        new Set(reports.map((r) => r.post_id).filter((v): v is number => !!v)),
    );

    const commentIds = Array.from(
        new Set(
            reports.map((r) => r.comment_id).filter((v): v is number => !!v),
        ),
    );

    const [postsRes, commentsRes] = await Promise.all([
        postIds.length
            ? admin
                .from("posts")
                .select("id,title,status,author_user_id")
                .in("id", postIds)
            : Promise.resolve({ data: [], error: null }),
        commentIds.length
            ? admin
                .from("comments")
                .select("id,post_id,body,status,author_user_id")
                .in("id", commentIds)
            : Promise.resolve({ data: [], error: null }),
    ]);

    const postMap = new Map<number, PostRow>(
        ((postsRes.data ?? []) as unknown as PostRow[]).map((p) => [p.id, p]),
    );

    const commentMap = new Map<number, CommentRow>(
        ((commentsRes.data ?? []) as unknown as CommentRow[]).map((c) => [c.id, c]),
    );

    const pendingCount = reports.filter((r) => r.status === "pending").length;

    return (
        <div className="space-y-5">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">举报处理</h1>
                    <p className="mt-1 text-sm text-foreground/70">
                        共 {reports.length} 条，待处理 {pendingCount} 条
                    </p>
                </div>
                <Link
                    href="/"
                    className="hidden h-10 items-center rounded-full border border-foreground/10 bg-background px-4 text-sm font-medium hover:bg-foreground/[0.03] sm:inline-flex"
                >
                    返回前台
                </Link>
            </div>

            {reports.length === 0 ? (
                <div className="rounded-2xl border border-foreground/10 bg-background p-10 text-center">
                    <p className="text-sm text-foreground/70">暂无举报</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {reports.map((r) => {
                        const reasonLabel = reasonMap.get(r.reason_id) ?? `原因#${r.reason_id}`;
                        const isPending = r.status === "pending";

                        const post = r.post_id ? postMap.get(r.post_id) : null;
                        const comment = r.comment_id ? commentMap.get(r.comment_id) : null;

                        const targetAuthorId = r.post_id
                            ? post?.author_user_id
                            : r.comment_id
                                ? comment?.author_user_id
                                : null;

                        const targetLabel = r.post_id
                            ? `帖子 #${r.post_id}`
                            : r.comment_id
                                ? `评论 #${r.comment_id}`
                                : "未知对象";

                        const postLinkId = r.post_id ?? comment?.post_id ?? null;

                        return (
                            <div
                                key={r.id}
                                className="rounded-2xl border border-foreground/10 bg-background p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="text-sm text-foreground/70">
                                        #{r.id} · {formatTime(r.created_at)} · {targetLabel}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`rounded-full border px-2 py-0.5 text-xs ${isPending
                                                ? "border-red-500/30 text-red-600"
                                                : "border-foreground/10 text-foreground/60"
                                                }`}
                                        >
                                            {isPending ? "待处理" : "已处理"}
                                        </span>
                                        {isPending ? (
                                            <div className="flex items-center gap-2">
                                                <form action={markReportHandledAction}>
                                                    <input
                                                        type="hidden"
                                                        name="reportId"
                                                        value={String(r.id)}
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="h-8 rounded-full bg-foreground px-3 text-xs font-medium text-background hover:opacity-90"
                                                    >
                                                        标记已处理
                                                    </button>
                                                </form>

                                                {comment?.id ? (
                                                    <form action={deleteCommentAction}>
                                                        <input
                                                            type="hidden"
                                                            name="commentId"
                                                            value={String(comment.id)}
                                                        />
                                                        <button
                                                            type="submit"
                                                            className="h-8 rounded-full border border-foreground/15 bg-background px-3 text-xs font-medium hover:bg-foreground/[0.03] disabled:opacity-60"
                                                            disabled={comment.status !== "normal"}
                                                        >
                                                            删除评论
                                                        </button>
                                                    </form>
                                                ) : null}

                                                {targetAuthorId ? (
                                                    <form action={banUserAction}>
                                                        <input
                                                            type="hidden"
                                                            name="userId"
                                                            value={targetAuthorId}
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name="note"
                                                            value={`from report #${r.id}`}
                                                        />
                                                        <button
                                                            type="submit"
                                                            className="h-8 rounded-full border border-foreground/15 bg-background px-3 text-xs font-medium hover:bg-foreground/[0.03]"
                                                        >
                                                            封禁用户
                                                        </button>
                                                    </form>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="mt-3 grid gap-2 text-sm">
                                    <div>
                                        <span className="text-foreground/60">原因：</span>
                                        <span className="text-foreground/90">{reasonLabel}</span>
                                    </div>

                                    {r.note ? (
                                        <div>
                                            <span className="text-foreground/60">补充：</span>
                                            <span className="text-foreground/90">{r.note}</span>
                                        </div>
                                    ) : null}

                                    {postLinkId ? (
                                        <div>
                                            <span className="text-foreground/60">跳转：</span>
                                            <Link
                                                className="text-foreground underline underline-offset-4 hover:opacity-80"
                                                href={`/post/${postLinkId}`}
                                            >
                                                打开帖子
                                            </Link>
                                        </div>
                                    ) : null}

                                    {post ? (
                                        <div className="text-foreground/70">
                                            帖子状态：{post.status}
                                            {post.title ? ` · 标题：${post.title}` : ""}
                                        </div>
                                    ) : null}

                                    {comment ? (
                                        <div className="text-foreground/70">
                                            评论状态：{comment.status} · 内容：
                                            {comment.body.length > 80
                                                ? `${comment.body.slice(0, 80)}…`
                                                : comment.body}
                                        </div>
                                    ) : null}

                                    {r.handled_at ? (
                                        <div className="text-xs text-foreground/50">
                                            处理时间：{formatTime(r.handled_at)}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
