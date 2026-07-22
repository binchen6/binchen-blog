"use client";

import Link from "next/link";
import { BookOpen, Pen, Trash2 } from "lucide-react";
import { SurfacePanel } from "@/components/page-chrome";
import { toast } from "@/components/toast";
import { formatDate } from "@/lib/utils";
import type { ManagePost } from "./types";

interface MyPostsProps {
  posts: ManagePost[];
  authHeaders: Record<string, string>;
  onDeleted: (slug: string) => void;
}

/** 我的文章列表：状态/日期展示，跳转撰写页编辑，删除确认 */
export function MyPosts({ posts, authHeaders, onDeleted }: MyPostsProps) {
  const deletePost = async (slug: string) => {
    if (!confirm("确定删除这篇文章吗？相关评论也会被删除。")) return;
    const res = await fetch(`/api/posts/${slug}`, { method: "DELETE", headers: authHeaders });
    if (res.ok) onDeleted(slug);
    else toast("删除文章失败", "error");
  };

  return (
    <SurfacePanel className="p-6">
      <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
        <BookOpen size={20} className="text-bronze" />
        我的文章
      </h2>
      {posts.length === 0 ? (
        <p className="text-sm text-ink-muted">暂无文章。</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.slug} className="border border-cyan-dark/10 bg-paper/55 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="line-clamp-1 text-sm font-semibold">{post.title}</span>
                <span className="shrink-0 text-[11px] text-bronze">{post.status === "published" ? "已发布" : "草稿"}</span>
              </div>
              <div className="mb-3 font-mono-tech text-[11px] text-ink-muted">{formatDate(post.published_at || post.created_at)}</div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/write?edit=${encodeURIComponent(post.slug)}`} className="inline-flex items-center gap-1 text-xs text-cyan-dark hover:text-bronze">
                  <Pen size={12} />
                  去撰写页修改
                </Link>
                <button type="button" onClick={() => deletePost(post.slug)} className="inline-flex items-center gap-1 text-xs text-cinnabar hover:text-cinnabar-dark">
                  <Trash2 size={12} />
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SurfacePanel>
  );
}
