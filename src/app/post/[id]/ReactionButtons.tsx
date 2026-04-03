"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleReactionAction } from "@/app/_actions/treehole";

type ReactionType = "like" | "hug";

export function ReactionButtons({
    postId,
    initialReaction,
    likeCount,
    hugCount,
    commentCount,
    canReact,
}: {
    postId: string;
    initialReaction: ReactionType | null;
    likeCount: number;
    hugCount: number;
    commentCount: number;
    canReact: boolean;
}) {
    const router = useRouter();
    const [optimisticReaction, setOptimisticReaction] = useState<ReactionType | null>(
        initialReaction,
    );
    const [optimisticLikeCount, setOptimisticLikeCount] = useState(likeCount);
    const [optimisticHugCount, setOptimisticHugCount] = useState(hugCount);
    const [message, setMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function buttonClass(isActive: boolean) {
        return `inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm transition-colors ${isActive
            ? "border-foreground bg-foreground text-background hover:opacity-90"
            : "border-foreground/15 hover:bg-foreground/5"
            }`;
    }

    function toggle(type: ReactionType) {
        if (!canReact || isPending) return;
        setMessage(null);

        const prev = optimisticReaction;
        const next = prev === type ? null : type;
        const prevLike = optimisticLikeCount;
        const prevHug = optimisticHugCount;

        let nextLike = prevLike;
        let nextHug = prevHug;
        if (prev === "like") nextLike = Math.max(0, nextLike - 1);
        if (prev === "hug") nextHug = Math.max(0, nextHug - 1);
        if (next === "like") nextLike += 1;
        if (next === "hug") nextHug += 1;

        setOptimisticReaction(next);
        setOptimisticLikeCount(nextLike);
        setOptimisticHugCount(nextHug);

        startTransition(() => {
            void (async () => {
                try {
                    const formData = new FormData();
                    formData.set("postId", postId);
                    formData.set("reactionType", type);
                    await toggleReactionAction(formData);
                    router.refresh();
                } catch {
                    setOptimisticReaction(prev);
                    setOptimisticLikeCount(prevLike);
                    setOptimisticHugCount(prevHug);
                    setMessage("操作失败，请稍后重试");
                }
            })();
        });
    }

    return (
        <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
                type="button"
                className={buttonClass(optimisticReaction === "like")}
                onClick={() => toggle("like")}
                disabled={!canReact || isPending}
            >
                点赞 {optimisticLikeCount}
            </button>
            <button
                type="button"
                className={buttonClass(optimisticReaction === "hug")}
                onClick={() => toggle("hug")}
                disabled={!canReact || isPending}
            >
                抱抱 {optimisticHugCount}
            </button>

            <div className="ml-auto text-xs text-foreground/60">评论 {commentCount}</div>

            {message ? (
                <div className="w-full text-sm text-red-600">{message}</div>
            ) : null}
        </div>
    );
}
