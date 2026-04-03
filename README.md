# tree-hole

这是一个“匿名树洞 MVP”项目，技术栈为 Next.js + Supabase（Auth + Postgres）+ Vercel。

## Getting Started

### 1) 初始化 Supabase 数据库

在 Supabase Dashboard -> SQL Editor 执行：

- supabase/schema.sql

它会创建：分类、帖子、评论、点赞/抱抱、举报及统计视图（post_list/post_stats），并开启基础 RLS。

### 2) 配置环境变量

复制 `.env.example` 为 `.env.local`，并填写：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

可选：

- `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN`（限制校园邮箱域名，例如 `xxx.edu.cn`）
- `NEXT_PUBLIC_SITE_URL`（本地开发通常是 `http://localhost:3000`）

管理后台（举报处理）额外需要：

- `SUPABASE_SERVICE_ROLE_KEY`（只配在服务端环境变量，禁止暴露到前端）
- `ADMIN_USER_IDS`（管理员用户 UUID，逗号分隔）

### 3) 启动开发服务器

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 已实现页面（用户端）

- `/` 首页列表（分类筛选、倒序）
- `/login` 邮箱链接登录 + 密码登录（支持 returnTo 回跳）
- `/new` 发帖
- `/post/[id]` 详情（评论、点赞/抱抱二选一可取消、举报入口）
- `/report` 举报表单
- `/settings` 账号设置（邮箱打码、改密码、退出）

### 已实现页面（管理端）

- `/admin/reports` 举报列表与处理（标记已处理、删除评论、封禁用户）

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

将本仓库导入 Vercel，然后在项目的 Environment Variables 中配置同样的 Supabase 环境变量即可。

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
