"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Calendar, Clock, Eye, FileText, PenLine, Search, Tag, X } from "lucide-react";
import { EmptyState, PageHeader, SiteShell } from "@/components/page-chrome";
import { PostCardSkeleton } from "@/components/site-widgets";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useScrollReveal } from "@/lib/use-reveal";
import { cn, formatDate } from "@/lib/utils";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  images: string | null;
  mode: "article" | "moment";
  created_at: string;
  published_at: string;
  tags: string | null;
  view_count: number;
  reading_time_minutes?: number;
}

const PAGE_SIZE = 9;

const NUMERALS = ["壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];

const modeTabs = [
  { value: "", label: "全部" },
  { value: "article", label: "文章" },
  { value: "moment", label: "动态" },
] as const;

function BlogContent() {
  useDocumentTitle("文章", "旅行见闻、生活片刻与技术笔记 —— binchen 的文章列表。");

  const searchParams = useSearchParams();
  const initialTag = searchParams.get("tag") || "";

  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<string>("");
  const [tag, setTag] = useState(initialTag);
  const [allTags, setAllTags] = useState<string[]>([]);
  const requestId = useRef(0);
  useScrollReveal([loading, loadingMore]);

  // 拉一遍标签云（个人博客量级，limit=100 足够）
  useEffect(() => {
    let cancelled = false;
    fetch("/api/posts?limit=100")
      .then((res) => res.json() as Promise<{ posts?: Post[] }>)
      .then((data) => {
        if (cancelled) return;
        const counter = new Map<string, number>();
        (data.posts || []).forEach((post) => {
          post.tags?.split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => {
            counter.set(t, (counter.get(t) || 0) + 1);
          });
        });
        setAllTags(Array.from(counter.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const buildQuery = useCallback(
    (offset: number) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset), total: "1" });
      if (query) params.set("q", query);
      if (mode) params.set("mode", mode);
      if (tag) params.set("tag", tag);
      return params.toString();
    },
    [query, mode, tag]
  );

  // 筛选变化 → 重新加载第一页
  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    fetch(`/api/posts?${buildQuery(0)}`)
      .then((res) => res.json() as Promise<{ posts?: Post[]; total?: number }>)
      .then((data) => {
        if (id !== requestId.current) return;
        setPosts(data.posts || []);
        setTotal(data.total ?? (data.posts || []).length);
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setPosts([]);
        setTotal(0);
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [buildQuery]);

  const loadMore = () => {
    const id = requestId.current;
    setLoadingMore(true);
    fetch(`/api/posts?${buildQuery(posts.length)}`)
      .then((res) => res.json() as Promise<{ posts?: Post[]; total?: number }>)
      .then((data) => {
        if (id !== requestId.current) return;
        setPosts((current) => [...current, ...(data.posts || [])]);
        if (data.total !== undefined) setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => {
        if (id === requestId.current) setLoadingMore(false);
      });
  };

  const hasFilter = Boolean(query || mode || tag);
  const hasMore = posts.length < total;

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-28">
        <PageHeader
          eyebrow="Articles"
          title="文章列表"
          icon={<FileText size={22} />}
          description="把旅行见闻、生活片刻和技术笔记放在同一张安静的纸面上。"
        />

        {/* 工具栏：搜索 + 模式筛选 */}
        <div className="mt-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索标题、摘要或标签..."
              className="w-full bg-paper/70 pl-10 pr-9"
              aria-label="搜索文章"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-cinnabar"
                aria-label="清除搜索"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 border border-cyan-dark/10 bg-paper/70 p-1">
            {modeTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setMode(tab.value)}
                className={cn(
                  "px-4 py-1.5 font-serif-zh text-sm tracking-[0.1em] transition-colors",
                  mode === tab.value ? "bg-cyan-dark text-bronze-light" : "text-ink-light hover:text-ink"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 标签云 */}
        {allTags.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Tag size={14} className="text-bronze" />
            {allTags.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTag((current) => (current === item ? "" : item))}
                className={cn(
                  "border px-2.5 py-1 text-xs transition-colors",
                  tag === item
                    ? "border-bronze bg-bronze/15 text-bronze-dark"
                    : "border-mist bg-paper/60 text-ink-muted hover:border-bronze/50 hover:text-bronze"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {/* 结果统计 */}
        {!loading && (
          <p className="mt-8 font-mono-tech text-xs text-ink-muted">
            {hasFilter ? `找到 ${total} 篇相关内容` : `共 ${total} 篇`}
          </p>
        )}

        <div className="mt-6">
          {loading ? (
            <PostCardSkeleton count={6} />
          ) : posts.length === 0 ? (
            <EmptyState
              title={hasFilter ? "没有匹配的内容" : "暂无文章"}
              description={hasFilter ? "换个关键词或清除筛选条件试试。" : "发布第一篇文章后，这里会出现内容。"}
              action={
                hasFilter ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setMode("");
                      setTag("");
                    }}
                    className="btn-outline inline-flex items-center gap-2"
                  >
                    <X size={14} />
                    清除筛选
                  </button>
                ) : (
                  <Link href="/write" className="btn-tech inline-flex items-center gap-2">
                    写第一篇
                    <ArrowRight size={14} />
                  </Link>
                )
              }
            />
          ) : (
            <>
              <div>
                {posts.map((post, index) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="tie-card group"
                    data-reveal
                    style={{ transitionDelay: `${(index % 9) * 45}ms` }}
                  >
                    {index < NUMERALS.length && (
                      <span className="tie-card__num">{NUMERALS[index]}</span>
                    )}
                    <div className="tie-card__body">
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <h2 className="font-serif-zh text-xl font-bold tracking-[0.06em] transition-colors group-hover:text-dai">
                          {post.title}
                        </h2>
                        <span className="font-mono-tech text-xs text-ink-4">
                          {formatDate(post.published_at || post.created_at)}
                        </span>
                        {post.mode === "moment" && <span className="text-xs text-gold">动态</span>}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-3">{post.excerpt}</p>
                      <div className="mt-3 flex items-center gap-4 font-mono-tech text-xs text-ink-4">
                        <span className="inline-flex items-center gap-1">
                          <Eye size={12} />
                          {post.view_count}
                        </span>
                        {post.reading_time_minutes ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} />
                            {post.reading_time_minutes} 分钟
                          </span>
                        ) : null}
                        {post.tags && (
                          <span className="inline-flex items-center gap-1 text-gold/80">
                            <Tag size={11} />
                            {post.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3).join(" · ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={16} className="mt-2 shrink-0 text-ink-4 transition-all group-hover:translate-x-1 group-hover:text-dai" />
                  </Link>
                ))}
              </div>

              {hasMore && (
                <div className="mt-12 text-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="btn-outline inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {loadingMore ? "加载中..." : `加载更多（${posts.length}/${total}）`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={
      <SiteShell>
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-28">
          <div className="mt-12">
            <PostCardSkeleton count={6} />
          </div>
        </section>
      </SiteShell>
    }>
      <BlogContent />
    </Suspense>
  );
}
