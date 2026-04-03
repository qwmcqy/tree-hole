"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireUser(returnTo?: string) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        const next = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
        redirect(`/login${next}`);
    }

    return { supabase, user };
}

const createPostSchema = z.object({
    categoryId: z.coerce.number().int().positive(),
    title: z.string().trim().max(200).optional().or(z.literal("")),
    body: z.string().trim().min(1, "正文不能为空").max(5000),
});

export async function createPostAction(formData: FormData) {
    const categoryId = formData.get("categoryId");
    const title = formData.get("title");
    const body = formData.get("body");

    const parsed = createPostSchema.safeParse({ categoryId, title, body });
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || "参数错误");
    }

    const { supabase } = await requireUser("/new");

    const { data, error } = await supabase
        .from("posts")
        .insert({
            category_id: parsed.data.categoryId,
            title: parsed.data.title ? parsed.data.title : null,
            body: parsed.data.body,
            status: "normal",
        })
        .select("id")
        .single();

    if (error) {
        throw new Error(error.message);
    }

    redirect(`/post/${data.id}`);
}

const createCommentSchema = z.object({
    postId: z.string().trim().min(1),
    body: z.string().trim().min(1, "评论不能为空").max(2000),
});

export async function createCommentAction(formData: FormData) {
    const postId = formData.get("postId");
    const body = formData.get("body");

    const parsed = createCommentSchema.safeParse({ postId, body });
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || "参数错误");
    }

    const { supabase } = await requireUser(`/post/${parsed.data.postId}`);

    const { error } = await supabase.from("comments").insert({
        post_id: parsed.data.postId,
        body: parsed.data.body,
        status: "normal",
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath(`/post/${parsed.data.postId}`);
}

const toggleReactionSchema = z.object({
    postId: z.string().trim().min(1),
    reactionType: z.enum(["like", "hug"]),
});

export async function toggleReactionAction(formData: FormData) {
    const postId = formData.get("postId");
    const reactionType = formData.get("reactionType");

    const parsed = toggleReactionSchema.safeParse({ postId, reactionType });
    if (!parsed.success) {
        throw new Error("参数错误");
    }

    const { supabase, user } = await requireUser(`/post/${parsed.data.postId}`);

    const existing = await supabase
        .from("post_reactions")
        .select("id,reaction_type")
        .eq("post_id", parsed.data.postId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (existing.error) {
        throw new Error(existing.error.message);
    }

    if (existing.data && existing.data.reaction_type === parsed.data.reactionType) {
        const del = await supabase
            .from("post_reactions")
            .delete()
            .eq("id", existing.data.id);
        if (del.error) throw new Error(del.error.message);
    } else if (existing.data) {
        const del = await supabase
            .from("post_reactions")
            .delete()
            .eq("id", existing.data.id);
        if (del.error) throw new Error(del.error.message);

        const ins = await supabase.from("post_reactions").insert({
            post_id: parsed.data.postId,
            reaction_type: parsed.data.reactionType,
        });
        if (ins.error) {
            const msg = (ins.error.message || "").toLowerCase();
            if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
                await supabase
                    .from("post_reactions")
                    .delete()
                    .eq("post_id", parsed.data.postId)
                    .eq("user_id", user.id);
                return;
            }
            throw new Error(ins.error.message);
        }
    } else {
        const ins = await supabase.from("post_reactions").insert({
            post_id: parsed.data.postId,
            reaction_type: parsed.data.reactionType,
        });
        if (ins.error) {
            const msg = (ins.error.message || "").toLowerCase();
            if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
                await supabase
                    .from("post_reactions")
                    .delete()
                    .eq("post_id", parsed.data.postId)
                    .eq("user_id", user.id);
                return;
            }
            throw new Error(ins.error.message);
        }
    }

    revalidatePath(`/post/${parsed.data.postId}`);
    revalidatePath(`/`);
}

const reportSchema = z
    .object({
        targetType: z.enum(["post", "comment"]),
        targetId: z.string().trim().min(1),
        reasonId: z.coerce.number().int().positive(),
        note: z.string().trim().max(1000).optional().or(z.literal("")),
    })
    .superRefine((val, ctx) => {
        if (!val.targetType) {
            ctx.addIssue({ code: "custom", message: "请选择举报对象" });
        }
    });

export async function submitReportAction(formData: FormData) {
    const targetType = formData.get("targetType");
    const targetId = formData.get("targetId");
    const reasonId = formData.get("reasonId");
    const note = formData.get("note");
    const returnTo = String(formData.get("returnTo") || "/");

    const parsed = reportSchema.safeParse({ targetType, targetId, reasonId, note });
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || "参数错误");
    }

    const { supabase } = await requireUser(returnTo);

    const payload: Record<string, unknown> = {
        reason_id: parsed.data.reasonId,
        note: parsed.data.note ? parsed.data.note : null,
        status: "pending",
    };

    if (parsed.data.targetType === "post") {
        payload.post_id = parsed.data.targetId;
    } else {
        payload.comment_id = parsed.data.targetId;
    }

    const { error } = await supabase.from("reports").insert(payload);
    if (error) throw new Error(error.message);

    revalidatePath(returnTo);
    redirect(`${returnTo}?reported=1`);
}
