"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Copy, Eye, ListTree, MessageCircle, Send, Tag, Trash2, User, X } from "lucide-react";
import { EmptyState, SiteShell, SurfacePanel } from "@/components/page-chrome";
import { ReadingProgress } from "@/components/site-widgets";
import { toast } from "@/components/toast";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth, authFetch } from "@/lib/client-auth";
import { useDocumentTitle } from "@/lib/use-document-title";
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
  author_name?: string | null;
  author_username?: string | null;
  author_avatar?: string | null;
  author_bio?: string | null;
}

interface Comment {
  id: number;
  name: string;
  content: string;
  created_at: string;
  parent_id: number | null;
  user_id: number | null;
  user_display_name?: string | null;
  username?: string | null;
  user_avatar?: string | null;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface PostNavItem {
  slug: string;
  title: string;
}

/** 从 markdown 源提取目录（h2/h3，跳过代码块） */
function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  let inFence = false;
  markdown.split("\n").forEach((line) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!match) return;
    const text = match[2].replace(/[*_`[\]()#]/g, "").trim();
    if (!text) return;
    items.push({ id: `toc-${items.length}`, text, level: match[1].length });
  });
  return items;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [renderedContent, setRenderedContent] = useState("");
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeTocId, setActiveTocId] = useState("");
  const [tocOpen, setTocOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [prevPost, setPrevPost] = useState<PostNavItem | null>(null);
  const [nextPost, setNextPost] = useState<PostNavItem | null>(null);
  const [commentForm, setCommentForm] = useState({ name: "", email: "", content: "" });
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const { user: loggedInUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useDocumentTitle(post?.title, post?.excerpt || undefined);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function loadPost() {
      try {
        const postRes = await fetch(`/api/posts/${slug}`);
        const postData = (await postRes.json()) as { post?: Post };
        if (cancelled) return;

        if (postData.post) {
          setPost(postData.post);

          const [commentsRes, listRes] = await Promise.all([
            fetch(`/api/posts/${slug}/comments`),
            fetch("/api/posts?limit=100"),
          ]);
          const commentsData = (await commentsRes.json()) as { comments?: Comment[] };
          const listData = (await listRes.json()) as { posts?: { slug: string; title: string }[] };
          if (cancelled) return;

          setComments(commentsData.comments || []);

          // 上一篇/下一篇（按发布时间排序的列表中找相邻）
          const list = listData.posts || [];
          const index = list.findIndex((item) => item.slug === slug);
          if (index >= 0) {
            setPrevPost(index > 0 ? list[index - 1] : null);
            setNextPost(index < list.length - 1 ? list[index + 1] : null);
          }
        }
      } catch {
        if (!cancelled) {
          setPost(null);
          setComments([]);
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
    if (post.mode === "moment") return; // 动态不渲染 markdown

    let cancelled = false;
    setToc(extractToc(post.content));

    Promise.all([
      import("markdown-it"),
      import("dompurify"),
      import("markdown-it-footnote"),
      import("markdown-it-task-lists"),
      import("markdown-it-mark"),
    ]).then(([{ default: MarkdownIt }, { default: DOMPurify }, { default: footnote }, { default: taskLists }, { default: mark }]) => {
      if (cancelled) return;
      const md = new MarkdownIt({ html: false, linkify: true, typographer: true })
        .use(footnote)
        .use(taskLists, { enabled: true, label: true })
        .use(mark);
      const rendered = md.render(post.content);
      setRenderedContent(DOMPurify.sanitize(rendered, {
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
        ADD_ATTR: ["for", "checked", "disabled", "type", "id"],
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [post]);

  // 渲染后增强：标题锚点 + 代码复制按钮 + 图片灯箱
  useEffect(() => {
    const container = contentRef.current;
    if (!container || !renderedContent) return;

    // 标题加 id（与 extractToc 顺序一致）
    const headings = container.querySelectorAll("h2, h3");
    headings.forEach((heading, index) => {
      heading.id = `toc-${index}`;
      heading.classList.add("scroll-mt-24");
    });

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

  // TOC 滚动高亮
  useEffect(() => {
    if (toc.length === 0) return;
    const onScroll = () => {
      const headings = Array.from(document.querySelectorAll(".markdown-content h2, .markdown-content h3"));
      let current = "";
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= 120) current = heading.id;
      }
      setActiveTocId(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [toc]);

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

  const startReply = (comment: Comment) => {
    setReplyTo(comment);
    document.getElementById("comment-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser && (!commentForm.name || !commentForm.email)) return;
    if (!commentForm.content) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...commentForm, parentId: replyTo?.id }),
      });
      const data = (await res.json()) as { comment?: Comment };
      if (data.comment) {
        // 回复插入到对应楼层下方，顶层评论排到最前
        setComments((current) => {
          if (!replyTo) return [data.comment!, ...current];
          const index = current.findIndex((item) => item.id === replyTo.id);
          if (index < 0) return [...current, data.comment!];
          const next = [...current];
          next.splice(index + 1, 0, data.comment!);
          return next;
        });
        setCommentForm({ name: "", email: "", content: "" });
        setReplyTo(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (id: number) => {
    if (!confirm("确定删除这条评论吗？其回复会一并删除。")) return;
    const res = await authFetch(`/api/posts/${slug}/comments?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      // 后端级联删除子回复，前端同步移除
      setComments((current) => current.filter((comment) => comment.id !== id && comment.parent_id !== id));
    } else toast("删除失败", "error");
  };

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

  const readingTime = getReadingTime(post.content);
  const tags = post.tags?.split(",").map((tag) => tag.trim()).filter(Boolean) || [];
  let postImages: string[] = [];
  try {
    postImages = post.images ? JSON.parse(post.images) : [];
  } catch {
    postImages = [];
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
          <button type="button" className="absolute right-6 top-6 text-paper/80 transition-colors hover:text-bronze" aria-label="关闭">
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

      {/* 移动端 TOC 按钮 */}
      {toc.length > 0 && post.mode !== "moment" && (
        <div className="fixed bottom-8 left-6 z-40 xl:hidden">
          <button
            type="button"
            onClick={() => setTocOpen((value) => !value)}
            aria-label="打开目录"
            className="grid h-11 w-11 place-items-center border border-bronze/40 bg-paper/90 text-bronze shadow-lg backdrop-blur-md transition-colors hover:bg-bronze hover:text-paper"
          >
            <ListTree size={18} />
          </button>
          {tocOpen && (
            <SurfacePanel className="absolute bottom-14 left-0 max-h-[50vh] w-60 overflow-y-auto p-5">{tocPanel}</SurfacePanel>
          )}
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

        <section className="mt-14 border-t border-cyan-dark/10 pt-12">
          <h2 className="mb-8 flex items-center gap-2 font-serif-zh text-2xl font-bold tracking-[0.1em]">
            <MessageCircle size={24} className="text-bronze" />
            评论 ({comments.length})
          </h2>

          <SurfacePanel as="form" id="comment-form" onSubmit={handleSubmitComment} className="mb-10 space-y-4 p-6 scroll-mt-24">
            {replyTo && (
              <div className="flex items-center justify-between gap-3 border border-bronze/30 bg-bronze/10 px-3 py-2 text-xs text-ink-light">
                <span>回复 <span className="font-semibold text-bronze-dark">@{replyTo.user_display_name || replyTo.name}</span>：{replyTo.content.slice(0, 40)}{replyTo.content.length > 40 ? "…" : ""}</span>
                <button type="button" onClick={() => setReplyTo(null)} className="shrink-0 text-ink-muted transition-colors hover:text-cinnabar" aria-label="取消回复">
                  <X size={14} />
                </button>
              </div>
            )}
            {!loggedInUser && (
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="姓名"
                  value={commentForm.name}
                  onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                  className="w-full bg-paper/60"
                  required
                />
                <input
                  type="email"
                  placeholder="邮箱"
                  value={commentForm.email}
                  onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                  className="w-full bg-paper/60"
                  required
                />
              </div>
            )}
            {loggedInUser && (
              <p className="text-sm text-ink-muted">将以 {loggedInUser.display_name || loggedInUser.username} 的身份发表评论。</p>
            )}
            <textarea
              placeholder={replyTo ? "写下你的回复..." : "写下你的想法..."}
              value={commentForm.content}
              onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
              className="h-32 w-full resize-none bg-paper/60"
              required
            />
            <button type="submit" disabled={submitting} className="btn-tech inline-flex items-center gap-2 disabled:opacity-50">
              <Send size={16} />
              <span>{submitting ? "提交中..." : replyTo ? "发表回复" : "发表评论"}</span>
            </button>
          </SurfacePanel>

          <div className="space-y-5">
            {comments.length === 0 ? (
              <EmptyState title="暂无评论" description="来做第一个评论者吧。" />
            ) : (
              (() => {
                const topLevel = comments.filter((comment) => !comment.parent_id);
                const repliesOf = (id: number) => comments.filter((comment) => comment.parent_id === id);
                const renderCard = (comment: Comment, isReply = false) => {
                  const displayName = comment.user_display_name || comment.name;
                  const isAuthor = comment.user_id !== null && comment.user_id === post.author_id;
                  return (
                    <div key={comment.id} className={cn("paper-card p-6", isReply && "ml-6 border-l-2 border-l-bronze/40 md:ml-10")}>
                      <div className="mb-3 flex items-center gap-3">
                        <UserAvatar username={comment.username} avatar={comment.user_avatar} size={36} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            {comment.username ? (
                              <Link href={`/users/${encodeURIComponent(comment.username)}`} className="transition-colors hover:text-cyan-dark">
                                {displayName}
                              </Link>
                            ) : (
                              displayName
                            )}
                            {isAuthor && <span className="border border-cinnabar/40 px-1.5 py-px text-[10px] font-normal text-cinnabar">作者</span>}
                          </div>
                          <div className="font-mono-tech text-xs text-ink-muted">{formatDate(comment.created_at)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          {!isReply && (
                            <button type="button" onClick={() => startReply(comment)} className="inline-flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-cyan-dark">
                              <MessageCircle size={13} />
                              回复
                            </button>
                          )}
                          {loggedInUser && comment.user_id === loggedInUser.id && (
                            <button type="button" onClick={() => deleteComment(comment.id)} className="inline-flex items-center gap-1 text-xs text-cinnabar">
                              <Trash2 size={13} />
                              删除
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm leading-loose text-ink-light">{comment.content}</p>
                    </div>
                  );
                };
                return topLevel.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    {renderCard(comment)}
                    {repliesOf(comment.id).map((reply) => renderCard(reply, true))}
                  </div>
                ));
              })()
            )}
          </div>
        </section>
      </article>
    </SiteShell>
  );
}
