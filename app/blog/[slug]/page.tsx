"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Calendar, Eye, ArrowLeft, Tag, Send, MessageCircle, User } from "lucide-react";
import { formatDate, getReadingTime } from "@/lib/utils";
import MarkdownIt from "markdown-it";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string | null;
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
}

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentForm, setCommentForm] = useState({ name: "", email: "", content: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/posts/${slug}`)
      .then((res) => res.json() as any)
      .then((data) => {
        if (data.post) {
          setPost(data.post);
          fetch(`/api/posts/${slug}/comments`)
            .then((res) => res.json() as any)
            .then((commentData) => {
              setComments(commentData.comments || []);
            });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentForm.name || !commentForm.email || !commentForm.content) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentForm),
      });
      const data = await res.json() as any;
      if (data.comment) {
        setComments([data.comment, ...comments]);
        setCommentForm({ name: "", email: "", content: "" });
      }
    } catch (error) {
      console.error("Submit comment error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen relative">
        <Navigation />
        <div className="absolute inset-0 paper-texture-bg opacity-80 pointer-events-none" />
        <div className="pt-24 px-6 relative z-10">
          <div className="ink-loading h-1 max-w-md mx-auto" />
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen relative">
        <Navigation />
        <div className="absolute inset-0 paper-texture-bg opacity-80 pointer-events-none" />
        <div className="pt-24 px-6 text-center relative z-10">
          <h1 className="font-serif-zh text-2xl text-ink-light">文章未找到</h1>
          <Link href="/blog" className="btn-ink mt-8 inline-block">返回文章列表</Link>
        </div>
      </main>
    );
  }

  const readingTime = getReadingTime(post.content);

  return (
    <main className="min-h-screen relative">
      <Navigation />
      
      {/* 背景 */}
      <div className="absolute inset-0 paper-texture-bg opacity-80 pointer-events-none" />
      <div className="absolute inset-0 star-grid-bg opacity-40 pointer-events-none" />

      <article className="pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/blog" className="inline-flex items-center space-x-2 text-sm text-ink-muted hover:text-cyan-dark transition-colors mb-8">
              <ArrowLeft size={16} />
              <span>返回文章列表</span>
            </Link>

            {post.cover_image && (
              <div className="aspect-video overflow-hidden rounded-lg mb-8 border border-cyan-dark/10">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center space-x-4 mb-6 text-xs text-ink-muted font-mono-tech">
              <span className="flex items-center space-x-1">
                <Calendar size={12} />
                <span>{formatDate(post.published_at || post.created_at)}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Eye size={12} />
                <span>{post.view_count} 阅读</span>
              </span>
              <span>{readingTime} 分钟阅读</span>
            </div>

            <h1 className="font-serif-zh text-3xl md:text-4xl font-bold tracking-wider mb-6">
              {post.title}
            </h1>

            {post.tags && (
              <div className="flex items-center space-x-3 mb-8">
                {post.tags.split(",").map((tag) => (
                  <span key={tag} className="flex items-center space-x-1 text-xs text-bronze">
                    <Tag size={10} />
                    <span>{tag.trim()}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="w-16 h-px bg-gradient-to-r from-transparent via-bronze to-transparent mb-8" />

            <div
              className="markdown-content text-ink-light leading-relaxed"
              dangerouslySetInnerHTML={{ __html: md.render(post.content) }}
            />
          </motion.div>

          {/* Comments Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-16 pt-16 border-t border-cyan-dark/10"
          >
            <h2 className="font-serif-zh text-2xl font-bold tracking-wider mb-8 flex items-center space-x-2">
              <MessageCircle size={24} className="text-bronze" />
              <span>评论 ({comments.length})</span>
            </h2>

            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="mb-12 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="姓名"
                  value={commentForm.name}
                  onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                  className="w-full bg-paper/50 border-mist focus:border-cyan-dark focus:shadow-tech-glow-sm transition-all"
                  required
                />
                <input
                  type="email"
                  placeholder="邮箱"
                  value={commentForm.email}
                  onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                  className="w-full bg-paper/50 border-mist focus:border-cyan-dark focus:shadow-tech-glow-sm transition-all"
                  required
                />
              </div>
              <textarea
                placeholder="写下你的想法..."
                value={commentForm.content}
                onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                className="w-full h-32 resize-none bg-paper/50 border-mist focus:border-cyan-dark focus:shadow-tech-glow-sm transition-all"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="btn-tech flex items-center space-x-2 disabled:opacity-50"
              >
                <Send size={16} />
                <span>{submitting ? "提交中..." : "发表评论"}</span>
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-ink-muted font-serif-zh">暂无评论，来做第一个评论者吧！</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="paper-card p-6"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-dark/10 flex items-center justify-center">
                        <User size={16} className="text-cyan-dark" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold">{comment.name}</span>
                        <span className="text-xs text-ink-muted ml-2 font-mono-tech">{formatDate(comment.created_at)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-ink-light leading-relaxed">{comment.content}</p>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </article>

      <Footer />
    </main>
  );
}
