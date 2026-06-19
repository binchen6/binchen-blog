"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Eye, FileText, Tag } from "lucide-react";
import { EmptyState, PageHeader, SiteShell } from "@/components/page-chrome";
import { formatDate } from "@/lib/utils";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  created_at: string;
  published_at: string;
  tags: string | null;
  view_count: number;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/posts")
      .then((res) => res.json() as Promise<{ posts?: Post[] }>)
      .then((data) => {
        if (!cancelled) setPosts(data.posts || []);
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-28">
        <PageHeader
          eyebrow="Articles"
          title="文章列表"
          icon={<FileText size={22} />}
          description="把旅行见闻、生活片刻和技术笔记放在同一张安静的纸面上。"
        />

        <div className="mt-12">
          {loading ? (
            <div className="ink-loading mx-auto h-1 max-w-md" />
          ) : posts.length === 0 ? (
            <EmptyState
              title="暂无文章"
              description="初始化数据库或发布第一篇文章后，这里会出现内容。"
              action={
                <Link href="/write" className="btn-tech inline-flex items-center gap-2">
                  写第一篇
                  <ArrowRight size={14} />
                </Link>
              }
            />
          ) : (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="paper-card group flex h-full flex-col">
                  {post.cover_image && (
                    <div className="aspect-[16/10] overflow-hidden bg-paper-warm">
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-muted">
                      <span className="inline-flex items-center gap-1 font-mono-tech">
                        <Calendar size={12} />
                        {formatDate(post.published_at || post.created_at)}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono-tech">
                        <Eye size={12} />
                        {post.view_count}
                      </span>
                    </div>
                    <h2 className="font-serif-zh text-xl font-bold tracking-[0.08em] transition-colors group-hover:text-cyan-dark">
                      {post.title}
                    </h2>
                    <p className="mt-4 line-clamp-3 text-sm leading-loose text-ink-light">{post.excerpt}</p>
                    {post.tags && (
                      <div className="mt-5 flex items-center gap-2 text-xs text-bronze">
                        <Tag size={12} />
                        <span>{post.tags.split(",").map((tag) => tag.trim()).filter(Boolean).join(" · ")}</span>
                      </div>
                    )}
                    <span className="mt-6 inline-flex items-center gap-2 text-xs text-cyan-dark">
                      阅读全文
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
