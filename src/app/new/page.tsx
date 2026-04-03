import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPostAction } from "@/app/_actions/treehole";

export default async function NewPostPage() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?returnTo=/new");
    }

    const { data: categories, error } = await supabase
        .from("categories")
        .select("id,name")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

    if (error) {
        return (
            <div className="rounded-2xl border border-foreground/10 bg-background p-5">
                <p className="text-sm text-foreground/80">加载分类失败：{error.message}</p>
                <p className="mt-2 text-sm text-foreground/60">
                    请确认 Supabase 已初始化表结构。
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-2xl space-y-5">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">发布树洞</h1>
                <Link href="/" className="text-sm text-foreground/70 hover:text-foreground">
                    返回首页
                </Link>
            </div>

            <div className="rounded-2xl border border-foreground/10 bg-background p-5">
                <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 text-sm text-foreground/80">
                    发帖规则提示：禁止人身攻击、隐私泄露、引战等内容。
                </div>

                <form action={createPostAction} className="mt-5 space-y-4">
                    <div>
                        <label className="text-sm font-medium">分类</label>
                        <select
                            name="categoryId"
                            className="mt-2 w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                            required
                            defaultValue={categories?.[0]?.id}
                        >
                            {categories?.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">标题（可选）</label>
                        <input
                            name="title"
                            className="mt-2 w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                            placeholder="写个标题更容易被看到"
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">正文（必填）</label>
                        <textarea
                            name="body"
                            className="mt-2 min-h-40 w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                            placeholder="想说点什么……"
                            required
                        />
                    </div>

                    <button className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-foreground text-sm font-medium text-background hover:opacity-90">
                        发布
                    </button>
                </form>
            </div>
        </div>
    );
}
