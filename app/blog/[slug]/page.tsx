"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Copy, Eye, ListTree, MessageCircle, Tag, X } from "lucide-react";
import { EmptyState, SiteShell, SurfacePanel } from "@/components/page-chrome";
import { ReadingProgress } from "@/components/site-widgets";
import { toast } from "@/components/toast";
import { UserAvatar } from "@/components/user-avatar";
import { LikeButton } from "@/components/like-button";
import { CommentSection } from "@/components/comment-section";
import { useDocumentTitle } from "@/lib/use-document-title";
import { renderMarkdown, type TocItem } from "@/lib/markdown";
import { cn, formatDate, getReadingTime } from "@/lib/utils";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string | null;
  images: string | null;
  mode: "article" | "moment";
  author_id: number;
  created_at: string;
  published_at: string;
  tags: string | null;
  view_count: number;
  like_count?: number;
  author_name?: string | null;
  author_username?: string | null;
  author_avatar?: string | null;
  author_bio?: string | null;
}

interface PostNavItem {
  slug: string;
  title: string;
}

export default function BlogPostPage() {
  const params = useParams();
  // next-on-pages/edge 下 useParams 可能返回未解码的原始 slug，统一解码后再使用
  const rawSlug = params.slug as string;
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    slug = rawSlug;
  }

  const [post, setPost] = useState<Post | null>(null);
  const [likedByMe, setLikedByMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [renderedContent, setRenderedContent] = useState("");
  const [commentCount, setCommentCount] = useState(0);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeTocId, setActiveTocId] = useState("");
  const [tocOpen, setTocOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [prevPost, setPrevPost] = useState<PostNavItem | null>(null);
  const [nextPost, setNextPost] = useState<PostNavItem | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useDocumentTitle(post?.title, post?.excerpt || undefined);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function loadPost() {
      try {
        const postRes = await fetch(`/api/posts/${slug}`);
        const postData = (await postRes.json()) as { post?: Post; likedByMe?: boolean; prevPost?: PostNavItem | null; nextPost?: PostNavItem | null };
        if (cancelled) return;

        if (postData.post) {
          setPost(postData.post);
          setLikedByMe(!!postData.likedByMe);
          setPrevPost(postData.prevPost || null);
          setNextPost(postData.nextPost || null);
        }
      } catch {
        if (!cancelled) {
          setPost(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPost();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Markdown 渲染
  useEffect(() => {
    if (!post) {
      setRenderedContent("");
      setToc([]);
      return;
    }
    if (post.mode === "moment") {
      // 动态不渲染 markdown，清空上一篇遗留的渲染结果/目录
      setRenderedContent("");
      setToc([]);
      return;
    }

    let cancelled = false;

    // 渲染与 TOC 同源于 lib/markdown.ts，锚点在渲染期生成，保证 100% 同步
    renderMarkdown(post.content)
      .then(({ html, toc }) => {
        if (cancelled) return;
        setRenderedContent(html);
        setToc(toc);
      })
      .catch(() => {
        if (cancelled) return;
        setRenderedContent("");
        setToc([]);
      });

    return () => {
      cancelled = true;
    };
  }, [post]);

  // 渲染后增强：代码复制按钮 + 图片灯箱（标题 id 已在渲染期生成）
  useEffect(() => {
    const container = contentRef.current;
    if (!container || !renderedContent) return;

    // 代码块复制按钮
    container.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".code-copy-btn")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy-btn";
      button.textContent = "复制";
      button.addEventListener("click", () => {
        const code = pre.querySelector("code")?.textContent || pre.textContent || "";
        navigator.clipboard.writeText(code).then(() => {
          button.textContent = "已复制";
          button.classList.add("copied");
          setTimeout(() => {
            button.textContent = "复制";
            button.classList.remove("copied");
          }, 1600);
        });
      });
      pre.appendChild(button);
    });

    // 图片灯箱
    const images = container.querySelectorAll("img");
    const openLightbox = (event: Event) => {
      setLightboxSrc((event.currentTarget as HTMLImageElement).src);
    };
    images.forEach((img) => img.addEventListener("click", openLightbox));

    return () => {
      images.forEach((img) => img.removeEventListener("click", openLightbox));
    };
  }, [renderedContent]);

  // TOC 滚动高亮：IntersectionObserver 观察阅读视窗内的标题
  useEffect(() => {
    if (toc.length === 0 || !renderedContent) {
      setActiveTocId("");
      return;
    }
    const container = contentRef.current;
    if (!container) return;
    const headings = Array.from(container.querySelectorAll("h2[id], h3[id]"));
    if (headings.length === 0) return;

    // 记录当前落在“阅读线”附近的标题，取最靠上者为激活项
    const visibleTops = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleTops.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visibleTops.delete(entry.target.id);
          }
        });
        const active = [...visibleTops.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
        if (active) setActiveTocId(active);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [toc, renderedContent]);

  // 灯箱 ESC 关闭 + 锁定背景滚动
  useEffect(() => {
    if (!lightboxSrc) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxSrc(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxSrc]);

  const scrollToHeading = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTocOpen(false);
  }, []);

  // 派生数据 memo 化：避免每次 render 重算大文本阅读时长 / 重复 JSON.parse
  const readingTime = useMemo(() => (post ? getReadingTime(post.content) : 0), [post]);
  const tags = useMemo(
    () => post?.tags?.split(",").map((tag) => tag.trim()).filter(Boolean) || [],
    [post]
  );
  const postImages = useMemo(() => {
    if (!post?.images) return [] as string[];
    try {
      return JSON.parse(post.images) as string[];
    } catch {
      return [] as string[];
    }
  }, [post]);

  if (loading) {
    return (
      <SiteShell withFooter={false} compactDecor>
        <section className="mx-auto max-w-4xl px-6 pb-20 pt-28">
          <div className="skeleton mb-8 aspect-[16/9] w-full" />
          <div className="space-y-5">
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-10 w-4/5" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-2/3" />
          </div>
        </section>
      </SiteShell>
    );
  }

  if (!post) {
    return (
      <SiteShell>
        <section className="px-6 pb-20 pt-28">
          <EmptyState
            title="文章未找到"
            description="这篇文章可能还没有发布，或链接已经失效。"
            action={
              <Link href="/blog" className="btn-ink inline-flex items-center gap-2">
                <ArrowLeft size={14} />
                返回文章列表
              </Link>
            }
          />
        </section>
      </SiteShell>
    );
  }

  const tocPanel = toc.length > 0 && (
    <nav aria-label="文章目录">
      <p className="mb-4 flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.18em] text-cyan-dark/70">
        <ListTree size={14} className="text-bronze" />
        目录
      </p>
      <ul className="space-y-2.5 border-l border-mist pl-4">
        {toc.map((item) => (
          <li key={item.id} style={{ paddingLeft: item.level === 3 ? "0.9rem" : 0 }}>
            <button
              type="button"
              onClick={() => scrollToHeading(item.id)}
              className={cn(
                "text-left text-xs leading-relaxed transition-colors",
                item.level === 3 ? "text-ink-muted" : "text-ink-light",
                activeTocId === item.id && "font-semibold text-cinnabar"
              )}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <SiteShell>
      <ReadingProgress />

      {/* 灯箱 */}
      {lightboxSrc && (
        <div className="lightbox-overlay" onClick={() => setLightboxSrc(null)} role="dialog" aria-label="查看图片">
          <button type="button" className="absolute right-4 top-4 text-paper/80 transition-colors hover:text-bronze sm:right-6 sm:top-6" aria-label="关闭">
            <X size={28} />
          </button>
          <img src={lightboxSrc} alt="放大查看" />
        </div>
      )}

      {/* 桌面端 TOC（右侧悬浮） */}
      {toc.length > 0 && post.mode !== "moment" && (
        <aside className="fixed right-6 top-32 z-30 hidden w-52 xl:block">
          <SurfacePanel className="max-h-[60vh] overflow-y-auto p-5">{tocPanel}</SurfacePanel>
        </aside>
      )}

      {/* 触屏底部操作栏：点赞 / 评论 / 目录 / 分享 */}
      <div className="action-bar touch-only-2" role="toolbar" aria-label="文章操作">
        <div className="action-bar__btn">
          <LikeButton targetType="post" targetId={post.id} initialCount={post.like_count || 0} initialLiked={likedByMe} size={20} />
          <span>点赞</span>
        </div>
        <button
          type="button"
          className="action-bar__btn"
          onClick={() => document.getElementById("comment-form")?.scrollIntoView({ behavior: "smooth", block: "center" })}
        >
          <MessageCircle size={20} />
          <span>评论</span>
        </button>
        {toc.length > 0 && post.mode !== "moment" && (
          <button type="button" className="action-bar__btn" onClick={() => setTocOpen((value) => !value)} aria-expanded={tocOpen}>
            <ListTree size={20} />
            <span>目录</span>
          </button>
        )}
        <button
          type="button"
          className="action-bar__btn"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast("链接已复制到剪贴板", "ok");
          }}
        >
          <Copy size={20} />
          <span>分享</span>
        </button>
      </div>

      {/* 触屏目录面板（从底部操作栏展开） */}
      {tocOpen && toc.length > 0 && post.mode !== "moment" && (
        <div className="fixed inset-x-0 bottom-16 z-40 px-4 xl:hidden">
          <SurfacePanel className="max-h-[46vh] overflow-y-auto p-5 shadow-xl">{tocPanel}</SurfacePanel>
        </div>
      )}

      <article className="mx-auto max-w-4xl px-6 pb-20 pt-28">
        <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-cyan-dark">
          <ArrowLeft size={16} />
          <span>返回文章列表</span>
        </Link>

        {post.cover_image && (
          <button type="button" onClick={() => setLightboxSrc(post.cover_image!)} className="mb-8 block w-full cursor-zoom-in">
            <div className="aspect-[16/9] overflow-hidden border border-cyan-dark/10 bg-paper-warm">
              <img src={post.cover_image} alt={post.title} decoding="async" className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]" />
            </div>
          </button>
        )}

        <SurfacePanel as="section" className="p-7 md:p-10">
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1 font-mono-tech">
              <Calendar size={12} />
              {formatDate(post.published_at || post.created_at)}
            </span>
            <span className="inline-flex items-center gap-1 font-mono-tech">
              <Eye size={12} />
              {post.view_count} 阅读
            </span>
            <span className="font-mono-tech">约 {readingTime} 分钟</span>
            {post.mode === "moment" && <span className="border border-bronze/25 px-2 py-0.5 text-bronze">动态</span>}
          </div>

          <h1 className="font-serif-zh text-3xl font-bold leading-tight tracking-[0.1em] md:text-5xl">{post.title}</h1>

          {tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1 text-xs text-bronze transition-colors hover:text-bronze-dark"
                >
                  <Tag size={11} />
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <div className="my-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-bronze to-transparent" />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast("链接已复制到剪贴板", "ok");
              }}
              className="inline-flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-bronze"
              aria-label="复制文章链接"
            >
              <Copy size={13} />
              分享
            </button>
            <span className="text-mist">·</span>
            <LikeButton targetType="post" targetId={post.id} initialCount={post.like_count || 0} initialLiked={likedByMe} />
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-bronze to-transparent" />
          </div>

          {post.mode === "moment" ? (
            <div className="space-y-7">
              <p className="whitespace-pre-wrap text-base leading-loose text-ink-light">{post.content}</p>
              {postImages.length > 0 && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {postImages.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setLightboxSrc(url)}
                      className="aspect-square overflow-hidden border border-cyan-dark/10 bg-paper-warm"
                    >
                      <img src={url} alt={post.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div ref={contentRef} className="markdown-content text-ink-light" dangerouslySetInnerHTML={{ __html: renderedContent }} />
          )}
        </SurfacePanel>

        {/* 作者卡片 */}
        {post.author_username && (
          <Link href={`/users/${encodeURIComponent(post.author_username)}`} className="paper-card group mt-8 flex items-center gap-4 p-5">
            <UserAvatar username={null} avatar={post.author_avatar} size={52} linkToProfile={false} className="!rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="font-serif-zh text-base font-semibold tracking-[0.06em] transition-colors group-hover:text-cyan-dark">
                {post.author_name || post.author_username}
              </div>
              {post.author_bio ? (
                <p className="mt-1 line-clamp-1 text-sm text-ink-muted">{post.author_bio}</p>
              ) : (
                <p className="mt-1 font-mono-tech text-xs text-ink-muted">@{post.author_username}</p>
              )}
            </div>
            <ArrowRight size={16} className="shrink-0 text-bronze opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        )}

        {/* 上一篇 / 下一篇 */}
        {(prevPost || nextPost) && (
          <nav className="mt-10 grid gap-4 sm:grid-cols-2" aria-label="文章导航">
            {prevPost ? (
              <Link href={`/blog/${prevPost.slug}`} className="paper-card group p-5">
                <span className="mb-2 flex items-center gap-1.5 font-mono-tech text-xs text-ink-muted">
                  <ArrowLeft size={13} className="text-bronze" />
                  上一篇（更新）
                </span>
                <span className="font-serif-zh text-base font-semibold tracking-[0.06em] transition-colors group-hover:text-cyan-dark">
                  {prevPost.title}
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}
            {nextPost && (
              <Link href={`/blog/${nextPost.slug}`} className="paper-card group p-5 text-right">
                <span className="mb-2 flex items-center justify-end gap-1.5 font-mono-tech text-xs text-ink-muted">
                  下一篇（更早）
                  <ArrowRight size={13} className="text-bronze" />
                </span>
                <span className="font-serif-zh text-base font-semibold tracking-[0.06em] transition-colors group-hover:text-cyan-dark">
                  {nextPost.title}
                </span>
              </Link>
            )}
          </nav>
        )}

        <CommentSection postId={post.id} postAuthorId={post.author_id} slug={slug} onCountChange={setCommentCount} />
      </article>
    </SiteShell>
  );
}
