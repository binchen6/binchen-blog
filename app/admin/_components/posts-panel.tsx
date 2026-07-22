"use client";

import Link from "next/link";
import { BookOpen, Trash2 } from "lucide-react";
import { SurfacePanel } from "@/components/page-chrome";
import { toast } from "@/components/toast";
import type { PostRow } from "./types";

export function PostsPanel({
  posts,
  setPosts,
  authHeaders,
}: {
  posts: PostRow[];
  setPosts: React.Dispatch<React.SetStateAction<PostRow[]>>;
  authHeaders: Record<string, string>;
}) {
  const deletePost = async (slug: string) => {
    if (!confirm("确定删除这篇文章吗？")) return;
    try {
      const res = await fetch(`/api/posts/${slug}`, { method: "DELETE", headers: authHeaders });
      if (res.ok) setPosts((current) => current.filter((post) => post.slug !== slug));
      else toast("删除文章失败", "error");
    } catch {
      toast("网络异常，删除失败", "error");
    }
  };

  const updateFeaturedPost = async (post: PostRow, isFeatured: boolean, featuredRank = post.featured_rank || 0) => {
    try {
      const res = await fetch("/api/admin/featured-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ slug: post.slug, isFeatured, featuredRank }),
      });
      const data = await res.json() as { post?: PostRow; error?: string };
      if (!res.ok || !data.post) {
        toast(data.error || "更新精选状态失败", "error");
        return;
      }
      setPosts((current) => current.map((item) => item.slug === post.slug ? { ...item, ...data.post } : item));
    } catch {
      toast("网络异常，更新精选状态失败", "error");
    }
  };

  return (
    <SurfacePanel className="p-6">
      <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
        <BookOpen size={20} className="text-bronze" />
        文章管理
      </h2>
      <div className="grid gap-3">
        {posts.map((post) => (
          <div key={post.slug} className="flex flex-wrap items-center justify-between gap-3 border border-cyan-dark/10 bg-paper/55 p-4">
            <div>
              <div className="font-semibold">{post.title}</div>
              <div className="mt-1 text-xs text-ink-muted">{post.author_username || "未知作者"} · {post.mode === "moment" ? "动态" : "文章"} · {post.status === "published" ? "已发布" : "草稿"}</div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {post.status === "published" && (
                <label className="inline-flex items-center gap-2 text-xs text-ink-muted">
                  排序
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={post.featured_rank || 0}
                    onChange={(e) => {
                      const featuredRank = Number(e.target.value || 0);
                      setPosts((current) => current.map((item) => item.slug === post.slug ? { ...item, featured_rank: featuredRank } : item));
                    }}
                    onBlur={() => {
                      if (post.is_featured) updateFeaturedPost(post, true, post.featured_rank || 0);
                    }}
                    className="h-8 w-16 bg-paper/70 px-2"
                  />
                </label>
              )}
              {post.status === "published" && (
                <button type="button" onClick={() => updateFeaturedPost(post, !post.is_featured)} className="text-cyan-dark">
                  {post.is_featured ? "取消精选" : "设为精选"}
                </button>
              )}
              {post.status === "published" && <Link href={`/blog/${post.slug}`} className="text-cyan-dark">查看</Link>}
              <button type="button" onClick={() => deletePost(post.slug)} className="inline-flex items-center gap-1 text-cinnabar">
                <Trash2 size={14} />
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </SurfacePanel>
  );
}
