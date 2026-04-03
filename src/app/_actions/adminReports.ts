"use server";

import { redirect } from "next/navigation";

import { isAdminUser } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isUuid(v: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        v,
    );
}

async function assertAdmin() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?returnTo=${encodeURIComponent("/admin/reports")}`);
    }

    if (!isAdminUser(user.id)) {
        throw new Error("Forbidden");
    }

    return { userId: user.id };
}

export async function markReportHandledAction(formData: FormData) {
    const reportIdRaw = String(formData.get("reportId") ?? "");
    const reportId = /^\d+$/.test(reportIdRaw) ? Number(reportIdRaw) : null;

    if (!reportId) {
        throw new Error("Invalid reportId");
    }

    await assertAdmin();

    const admin = createSupabaseAdminClient();
    const { error } = await admin
        .from("reports")
        .update({ status: "handled", handled_at: new Date().toISOString() })
        .eq("id", reportId);

    if (error) {
        throw new Error(error.message);
    }

    redirect("/admin/reports");
}

export async function deleteCommentAction(formData: FormData) {
    const commentIdRaw = String(formData.get("commentId") ?? "");
    const commentId = /^\d+$/.test(commentIdRaw) ? Number(commentIdRaw) : null;

    if (!commentId) {
        throw new Error("Invalid commentId");
    }

    await assertAdmin();
    const admin = createSupabaseAdminClient();

    const { error } = await admin
        .from("comments")
        .update({ status: "deleted" })
        .eq("id", commentId);

    if (error) {
        throw new Error(error.message);
    }

    redirect("/admin/reports");
}

export async function banUserAction(formData: FormData) {
    const targetUserId = String(formData.get("userId") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();

    if (!isUuid(targetUserId)) {
        throw new Error("Invalid userId");
    }

    const { userId: adminUserId } = await assertAdmin();
    const admin = createSupabaseAdminClient();

    const { error } = await admin.from("user_bans").upsert(
        {
            user_id: targetUserId,
            is_active: true,
            banned_at: new Date().toISOString(),
            banned_by: adminUserId,
            note: note || null,
        },
        { onConflict: "user_id" },
    );

    if (error) {
        throw new Error(error.message);
    }

    redirect("/admin/reports");
}
