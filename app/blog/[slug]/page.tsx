"use client";

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
      .then((res) => res.json())
      .then((data) => {
        if (data.post) {
          setPost(data.post);
          fetch(`/api/posts/${slug}/comments`)
            .then((res) => res.json())
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
      const data = await res.json();
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
      <main className="min-h-screen bg-paper">
        <Navigation />
        <div className="pt-24 px-6">
          <div className="ink-loading h-1 max-w-md mx-auto" />
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-paper">
        <Navigation />
        <div className="pt-24 px-6 text-center">
          <h1 className="font-serif-zh text-2xl text-ink-light">文章未找到</h1>
          <Link href="/blog" className="btn-ink mt-8 inline-block">返回文章列表</Link>
        </div>
      </main>
    );
  }

  const readingTime = getReadingTime(post.content);

  return (
    <main className="min-h-screen bg-paper">
      <Navigation />

      <article className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/blog" className="inline-flex items-center space-x-2 text-sm text-ink-light hover:text-ink transition-colors mb-8">
              <ArrowLeft size={16} />
              <span>返回文章列表</span>
            </Link>

            {post.cover_image && (
              <div className="aspect-video overflow-hidden rounded-sm mb-8">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center space-x-4 mb-6 text-xs text-stone">
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

            <div className="w-16 h-px bg-ink/10 mb-8" />

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
            className="mt-16 pt-16 border-t border-ink/5"
          >
            <h2 className="font-serif-zh text-2xl font-bold tracking-wider mb-8 flex items-center space-x-2">
              <MessageCircle size={24} />
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
                  className="w-full"
                  required
                />
                <input
                  type="email"
                  placeholder="邮箱"
                  value={commentForm.email}
                  onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                  className="w-full"
                  required
                />
              </div>
              <textarea
                placeholder="写下你的想法..."
                value={commentForm.content}
                onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                className="w-full h-32 resize-none"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="btn-ink flex items-center space-x-2 disabled:opacity-50"
              >
                <Send size={16} />
                <span>{submitting ? "提交中..." : "发表评论"}</span>
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <p className="text-stone text-center py-8">暂无评论，来做第一个评论者吧！</p>
              ) : (
                comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="paper-card p-6"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center">
                        <User size={16} className="text-ink-light" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold">{comment.name}</span>
                        <span className="text-xs text-stone ml-2">{formatDate(comment.created_at)}</span>
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
