import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCommentAction } from "@/app/_actions/treehole";
import { ReactionButtons } from "./ReactionButtons";

export const dynamic = "force-dynamic";

type CommentRow = {
    id: number;
    body: string;
    created_at: string;
    status: string;
};

type PostStatsRow = {
    post_id: number;
    comment_count: number;
    like_count: number;
    hug_count: number;
};

export default async function PostDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ reported?: string }>;
}) {
    const { id } = await params;
    const { reported } = await searchParams;
    const postId = (id || "").trim();
    if (!postId) notFound();

    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const [{ data: post, error: postError }, statsRes, commentsRes] =
        await Promise.all([
            supabase
                .from("posts")
                .select("id,title,body,created_at,status,category:categories(name)")
                .eq("id", postId)
                .single(),
            supabase.from("post_stats").select("*").eq("post_id", postId).maybeSingle(),
            supabase
                .from("comments")
                .select("id,body,created_at,status")
                .eq("post_id", postId)
                .eq("status", "normal")
                .order("created_at", { ascending: true }),
        ]);

    const reactionRes = user
        ? await supabase
            .from("post_reactions")
            .select("reaction_type")
            .eq("post_id", postId)
            .eq("user_id", user.id)
            .maybeSingle()
        : null;

    if (postError || !post) {
        notFound();
    }

    if (post.status !== "normal") {
        return (
            <div className="rounded-2xl border border-foreground/10 bg-background p-10 text-center">
                <p className="text-sm text-foreground/70">内容已被删除或折叠</p>
                <div className="mt-4">
                    <Link href="/" className="text-sm hover:underline">
                        返回首页
                    </Link>
                </div>
            </div>
        );
    }

    const stats = (statsRes.data ?? {
        post_id: postId,
        comment_count: 0,
        like_count: 0,
        hug_count: 0,
    }) as PostStatsRow;

    const comments = (commentsRes.data ?? []) as unknown as CommentRow[];
    const myReaction = (reactionRes?.data?.reaction_type ?? null) as
        | "like"
        | "hug"
        | null;

    const category = (post as unknown as {
        category?: { name?: string | null } | { name?: string | null }[] | null;
    }).category;

    const categoryName = Array.isArray(category)
        ? category?.[0]?.name ?? null
        : category?.name ?? null;

    return (
        <div className="mx-auto w-full max-w-3xl space-y-4">
            <div className="flex items-center justify-between">
                <Link href="/" className="text-sm text-foreground/70 hover:text-foreground">
                    ← 返回
                </Link>
                <Link
                    href={`/report?type=post&id=${encodeURIComponent(postId)}&returnTo=${encodeURIComponent(`/post/${postId}`)}`}
                    className="text-sm text-foreground/70 hover:text-foreground"
                >
                    举报
                </Link>
            </div>

            {reported === "1" ? (
                <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4 text-sm text-foreground/80">
                    已收到举报，我们会尽快处理。
                </div>
            ) : null}

            <article className="rounded-2xl border border-foreground/10 bg-background p-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-foreground/70">
                        匿名 · {new Date(post.created_at).toLocaleString()}
                    </div>
                    {categoryName ? (
                        <div className="rounded-full border border-foreground/10 px-2 py-0.5 text-xs text-foreground/70">
                            {categoryName}
                        </div>
                    ) : null}
                </div>

                {post.title ? (
                    <h1 className="mt-3 text-xl font-semibold tracking-tight">{post.title}</h1>
                ) : null}

                <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                    {post.body}
                </div>

                <ReactionButtons
                    key={`${postId}:${myReaction ?? "none"}:${stats.like_count}:${stats.hug_count}`}
                    postId={postId}
                    initialReaction={myReaction}
                    likeCount={stats.like_count}
                    hugCount={stats.hug_count}
                    commentCount={stats.comment_count}
                    canReact={Boolean(user)}
                />

                {!user ? (
                    <div className="mt-4 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 text-sm text-foreground/80">
                        登录后才能点赞/抱抱、评论与举报。
                        <Link
                            href={`/login?returnTo=${encodeURIComponent(`/post/${postId}`)}`}
                            className="ml-2 underline"
                        >
                            去登录
                        </Link>
                    </div>
                ) : null}
            </article>

            <section className="rounded-2xl border border-foreground/10 bg-background p-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">评论</h2>
                    <span className="text-xs text-foreground/60">匿名展示</span>
                </div>

                {user ? (
                    <form action={createCommentAction} className="mt-4 space-y-3">
                        <input type="hidden" name="postId" value={postId} />
                        <textarea
                            name="body"
                            className="min-h-24 w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                            placeholder="写下你的评论…"
                            required
                        />
                        <button className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-foreground text-sm font-medium text-background hover:opacity-90">
                            发表评论
                        </button>
                    </form>
                ) : null}

                <div className="mt-5 space-y-3">
                    {comments.length === 0 ? (
                        <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 text-sm text-foreground/70">
                            暂无评论
                        </div>
                    ) : (
                        comments.map((c) => (
                            <div key={c.id} className="rounded-xl border border-foreground/10 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-foreground/60">
                                        匿名 · {new Date(c.created_at).toLocaleString()}
                                    </div>
                                    <Link
                                        href={`/report?type=comment&id=${encodeURIComponent(String(c.id))}&returnTo=${encodeURIComponent(`/post/${postId}`)}`}
                                        className="text-xs text-foreground/60 hover:text-foreground"
                                    >
                                        举报
                                    </Link>
                                </div>
                                <div className="mt-2 whitespace-pre-wrap text-sm text-foreground/85">
                                    {c.body}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
