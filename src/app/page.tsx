import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Category = {
  id: number;
  name: string;
};

type PostListRow = {
  id: number;
  title: string | null;
  body: string;
  created_at: string;
  category_id: number;
  category_name: string;
  comment_count: number;
  like_count: number;
  hug_count: number;
  status: string;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[]; q?: string | string[] }>;
}) {
  const supabase = await createSupabaseServerClient();
  const sp = await searchParams;
  const categoryRaw = sp?.category;
  const qRaw = sp?.q;
  const categoryValue = Array.isArray(categoryRaw)
    ? categoryRaw[0]
    : categoryRaw;
  const categoryId = categoryValue && /^\d+$/.test(categoryValue)
    ? Number(categoryValue)
    : null;

  const qValue = Array.isArray(qRaw) ? qRaw[0] : qRaw;
  const q = (qValue ?? "").trim().slice(0, 50);
  const qSafe = q.replace(/[(),]/g, " ").replace(/\s+/g, " ").trim();

  const postQuery = supabase
    .from("post_list")
    .select(
      "id,title,body,created_at,category_id,category_name,comment_count,like_count,hug_count,status",
    )
    .eq("status", "normal");

  const postQueryWithFilters = categoryId
    ? postQuery.eq("category_id", categoryId)
    : postQuery;

  const postQueryWithSearch = qSafe
    ? postQueryWithFilters.or(
      `title.ilike.%${qSafe}%,body.ilike.%${qSafe}%`,
    )
    : postQueryWithFilters;

  const [{ data: categories }, postListRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
    postQueryWithSearch
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const listError = postListRes.error;
  const postRows = (postListRes.data ?? []) as unknown as PostListRow[];
  const filteredPosts = postRows;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">匿名树洞</h1>
          <p className="mt-1 text-sm text-foreground/70">
            发帖/评论/举报需登录，禁止人身攻击与隐私泄露。
          </p>
        </div>
        <Link
          href="/new"
          className="hidden h-10 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background hover:opacity-90 sm:inline-flex"
        >
          发布树洞
        </Link>
      </div>

      <form action="/" method="get" className="flex gap-2">
        <label className="sr-only" htmlFor="q">
          搜索
        </label>
        <input
          id="q"
          name="q"
          defaultValue={qSafe}
          className="h-10 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
          placeholder="搜索标题或内容…"
          inputMode="search"
        />
        {categoryId ? (
          <input type="hidden" name="category" value={String(categoryId)} />
        ) : null}
        <button
          type="submit"
          className="h-10 shrink-0 rounded-xl bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
        >
          搜索
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href={qSafe ? `/?q=${encodeURIComponent(qSafe)}` : "/"}
          className={`rounded-full border px-3 py-1 text-sm hover:bg-foreground/5 ${!categoryId ? "border-foreground/25" : "border-foreground/10"
            }`}
        >
          全部
        </Link>
        {(categories ?? []).map((c: Category) => (
          <Link
            key={c.id}
            href={
              qSafe
                ? `/?category=${c.id}&q=${encodeURIComponent(qSafe)}`
                : `/?category=${c.id}`
            }
            className={`rounded-full border px-3 py-1 text-sm hover:bg-foreground/5 ${categoryId === c.id ? "border-foreground/25" : "border-foreground/10"
              }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {listError ? (
        <div className="rounded-2xl border border-foreground/10 bg-background p-5">
          <p className="text-sm text-foreground/80">
            数据加载失败：{listError.message}
          </p>
          <p className="mt-2 text-sm text-foreground/60">
            如果你还没在 Supabase 初始化表/视图，请先执行项目提供的 schema SQL。
          </p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-background p-10 text-center">
          <p className="text-sm text-foreground/70">
            {qSafe ? "没有匹配的结果" : "暂无内容"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredPosts.map((p) => (
            <Link
              key={p.id}
              href={`/post/${p.id}`}
              className="rounded-2xl border border-foreground/10 bg-background p-4 hover:bg-foreground/[0.03]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-foreground/70">
                  匿名 · {new Date(p.created_at).toLocaleString()}
                </div>
                <div className="rounded-full border border-foreground/10 px-2 py-0.5 text-xs text-foreground/70">
                  {p.category_name}
                </div>
              </div>

              {p.title ? (
                <div className="mt-2 line-clamp-1 text-base font-medium">
                  {p.title}
                </div>
              ) : null}

              <div className="mt-2 line-clamp-3 text-sm text-foreground/80">
                {p.body}
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-foreground/60">
                <span>评论 {p.comment_count}</span>
                <span>点赞 {p.like_count}</span>
                <span>抱抱 {p.hug_count}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
