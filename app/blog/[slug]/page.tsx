"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Eye, MessageCircle, Send, Tag, Trash2, User } from "lucide-react";
import { EmptyState, SiteShell, SurfacePanel } from "@/components/page-chrome";
import { formatDate, getReadingTime } from "@/lib/utils";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string | null;
  images: string | null;
  mode: "article" | "moment";
  created_at: string;
  published_at: string;
  tags: string | null;
  view_count: number;
}

interface Comment {
  id: number;
  name: string;
  content: string;
  created_at: string;
  parent_id: number | null;
  user_id: number | null;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [renderedContent, setRenderedContent] = useState("");
  const [commentForm, setCommentForm] = useState({ name: "", email: "", content: "" });
  const [loggedInUser, setLoggedInUser] = useState<{ id: number; username: string; email?: string; display_name?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setLoggedInUser(JSON.parse(userStr));
      } catch {
        localStorage.removeItem("user");
      }
    }

    if (!slug) return;
    let cancelled = false;

    async function loadPost() {
      try {
        const postRes = await fetch(`/api/posts/${slug}`);
        const postData = (await postRes.json()) as { post?: Post };
        if (cancelled) return;

        if (postData.post) {
          setPost(postData.post);
          const commentsRes = await fetch(`/api/posts/${slug}/comments`);
          const commentsData = (await commentsRes.json()) as { comments?: Comment[] };
          if (!cancelled) setComments(commentsData.comments || []);
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

  useEffect(() => {
    if (!post) {
      setRenderedContent("");
      return;
    }

    let cancelled = false;
    Promise.all([import("markdown-it"), import("dompurify")]).then(([{ default: MarkdownIt }, { default: DOMPurify }]) => {
      if (cancelled) return;
      const md = new MarkdownIt({ html: false, linkify: true, typographer: true });
      const rendered = md.render(post.content);
      setRenderedContent(DOMPurify.sanitize(rendered, {
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [post]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser && (!commentForm.name || !commentForm.email)) return;
    if (!commentForm.content) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(commentForm),
      });
      const data = (await res.json()) as { comment?: Comment };
      if (data.comment) {
        setComments((current) => [data.comment!, ...current]);
        setCommentForm({ name: "", email: "", content: "" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (id: number) => {
    if (!confirm("确定删除这条评论吗？")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`/api/posts/${slug}/comments?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setComments((current) => current.filter((comment) => comment.id !== id));
    else alert("删除失败");
  };

  if (loading) {
    return (
      <SiteShell withFooter={false} compactDecor>
        <section className="px-6 pt-28">
          <div className="ink-loading mx-auto h-1 max-w-md" />
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

  return (
    <SiteShell>
      <article className="mx-auto max-w-4xl px-6 pb-20 pt-28">
        <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-cyan-dark">
          <ArrowLeft size={16} />
          <span>返回文章列表</span>
        </Link>

        {post.cover_image && (
          <div className="mb-8 aspect-[16/9] overflow-hidden border border-cyan-dark/10 bg-paper-warm">
            <img src={post.cover_image} alt={post.title} decoding="async" className="h-full w-full object-cover" />
          </div>
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
            <span className="font-mono-tech">{readingTime} 分钟阅读</span>
          </div>

          <h1 className="font-serif-zh text-3xl font-bold leading-tight tracking-[0.1em] md:text-5xl">{post.title}</h1>

          {tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs text-bronze">
                  <Tag size={11} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="my-8 h-px w-20 bg-gradient-to-r from-transparent via-bronze to-transparent" />

          {post.mode === "moment" ? (
            <div className="space-y-7">
              <p className="whitespace-pre-wrap text-base leading-loose text-ink-light">{post.content}</p>
              {postImages.length > 0 && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {postImages.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden border border-cyan-dark/10 bg-paper-warm">
                      <img src={url} alt={post.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="markdown-content text-ink-light" dangerouslySetInnerHTML={{ __html: renderedContent }} />
          )}
        </SurfacePanel>

        <section className="mt-14 border-t border-cyan-dark/10 pt-12">
          <h2 className="mb-8 flex items-center gap-2 font-serif-zh text-2xl font-bold tracking-[0.1em]">
            <MessageCircle size={24} className="text-bronze" />
            评论 ({comments.length})
          </h2>

          <SurfacePanel as="form" onSubmit={handleSubmitComment} className="mb-10 space-y-4 p-6">
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
              placeholder="写下你的想法..."
              value={commentForm.content}
              onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
              className="h-32 w-full resize-none bg-paper/60"
              required
            />
            <button type="submit" disabled={submitting} className="btn-tech inline-flex items-center gap-2 disabled:opacity-50">
              <Send size={16} />
              <span>{submitting ? "提交中..." : "发表评论"}</span>
            </button>
          </SurfacePanel>

          <div className="space-y-5">
            {comments.length === 0 ? (
              <EmptyState title="暂无评论" description="来做第一个评论者吧。" />
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="paper-card p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center border border-cyan-dark/10 bg-cyan-dark/5 text-cyan-dark">
                      <User size={16} />
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{comment.name}</div>
                      <div className="font-mono-tech text-xs text-ink-muted">{formatDate(comment.created_at)}</div>
                    </div>
                    {loggedInUser && comment.user_id === loggedInUser.id && (
                      <button type="button" onClick={() => deleteComment(comment.id)} className="inline-flex items-center gap-1 text-xs text-cinnabar">
                        <Trash2 size={13} />
                        删除
                      </button>
                    )}
                  </div>
                  <p className="text-sm leading-loose text-ink-light">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </article>
    </SiteShell>
  );
}
