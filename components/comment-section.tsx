"use client";

/**
 * 文章评论区 — 嵌套回复 + 点赞 + 删除。
 * 从 app/blog/[slug]/page.tsx 抽离：数据加载、乐观插入、删除、楼中楼分组全部内聚在此。
 * 通过 onCountChange 把评论数同步给页面操作栏。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, Trash2, X } from "lucide-react";
import { EmptyState, SurfacePanel } from "@/components/page-chrome";
import { LikeButton } from "@/components/like-button";
import { PostCardSkeleton } from "@/components/site-widgets";
import { toast } from "@/components/toast";
import { UserAvatar } from "@/components/user-avatar";
import { authFetch, useAuth } from "@/lib/client-auth";
import { cn, formatDate } from "@/lib/utils";

/** 评论（嵌套回复，parent_id 指向顶层评论） */
interface Comment {
  id: number;
  name: string;
  content: string;
  created_at: string;
  user_id: number | null;
  parent_id: number | null;
  username?: string | null;
  user_display_name?: string | null;
  user_avatar?: string | null;
  like_count?: number;
}

interface CommentSectionProps {
  /** 文章 id（提交评论 payload 用） */
  postId: number;
  /** 文章作者 id（评论"作者"徽章判定） */
  postAuthorId: number;
  /** 文章 slug（评论 API 路径） */
  slug: string;
  /** 评论数变化时同步给页面（操作栏角标） */
  onCountChange?: (count: number) => void;
}

export function CommentSection({ postId, postAuthorId, slug, onCountChange }: CommentSectionProps) {
  const { user: loggedInUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [likedCommentIds, setLikedCommentIds] = useState<number[]>([]);
  const [commentForm, setCommentForm] = useState({ name: "", email: "", content: "" });
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** 统一入口：更新列表并把数量同步给页面操作栏 */
  const applyComments = useCallback(
    (list: Comment[]) => {
      setComments(list);
      onCountChange?.(list.length);
    },
    [onCountChange]
  );

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/comments`);
      const data = (await res.json()) as { comments?: Comment[]; likedIds?: number[] };
      applyComments(data.comments || []);
      setLikedCommentIds(data.likedIds || []);
    } catch {
      applyComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [slug, applyComments]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // 评论按楼层分组：一次遍历出 Map，避免先建 topLevel + 每条 filter 的 O(n²)
  const groupedComments = useMemo(() => {
    const topLevel: Comment[] = [];
    const repliesMap = new Map<number, Comment[]>();
    for (const comment of comments) {
      if (comment.parent_id) {
        const bucket = repliesMap.get(comment.parent_id);
        if (bucket) bucket.push(comment);
        else repliesMap.set(comment.parent_id, [comment]);
      } else {
        topLevel.push(comment);
      }
    }
    return { topLevel, repliesMap };
  }, [comments]);

  const startReply = (comment: Comment) => {
    setReplyTo(comment);
    setCommentForm((prev) => ({ ...prev, content: "" }));
    document.getElementById("comment-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser && (!commentForm.name || !commentForm.email)) return;
    if (!commentForm.content) return;
    setSubmitting(true);
    try {
      const payload = loggedInUser
        ? { content: commentForm.content, postId, parentId: replyTo?.id }
        : { name: commentForm.name, email: commentForm.email, content: commentForm.content, postId, parentId: replyTo?.id };
      const res = await (loggedInUser ? authFetch : fetch)(`/api/posts/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string; comment?: Comment };
      if (!res.ok) {
        toast(data.error || "评论失败", "error");
        return;
      }
      toast(replyTo ? "回复成功" : "评论成功");
      setCommentForm({ name: "", email: "", content: "" });
      setReplyTo(null);
      // 乐观插入：回复插到父评论之后，顶层评论插到最前
      if (data.comment) {
        applyComments(
          replyTo
            ? (() => {
                const next = [...comments];
                next.splice(next.findIndex((c) => c.id === replyTo.id) + 1, 0, data.comment as Comment);
                return next;
              })()
            : [data.comment, ...comments]
        );
      }
    } catch {
      toast("网络异常，评论失败", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (id: number) => {
    if (!confirm("确定删除这条评论吗？其回复会一并删除。")) return;
    try {
      const res = await authFetch(`/api/posts/${encodeURIComponent(slug)}/comments?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("评论已删除");
        applyComments(comments.filter((c) => c.id !== id && c.parent_id !== id));
      } else {
        const data = (await res.json()) as { error?: string };
        toast(data.error || "删除失败", "error");
      }
    } catch {
      toast("网络异常，删除失败", "error");
    }
  };

  return (
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
          className="h-24 w-full resize-none bg-paper/60 sm:h-32"
          required
        />
        <button type="submit" disabled={submitting} className="btn-tech inline-flex items-center gap-2 disabled:opacity-50">
          <Send size={16} />
          <span>{submitting ? "提交中..." : replyTo ? "发表回复" : "发表评论"}</span>
        </button>
      </SurfacePanel>

      <div className="space-y-5">
        {commentsLoading ? (
          <PostCardSkeleton count={2} />
        ) : comments.length === 0 ? (
          <EmptyState title="暂无评论" description="来做第一个评论者吧。" />
        ) : (
          (() => {
            const { topLevel, repliesMap } = groupedComments;
            const renderCard = (comment: Comment, isReply = false) => {
              const displayName = comment.user_display_name || comment.name;
              const isAuthor = comment.user_id !== null && comment.user_id === postAuthorId;
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
                      <LikeButton
                        targetType="comment"
                        targetId={comment.id}
                        initialCount={comment.like_count || 0}
                        initialLiked={likedCommentIds.includes(comment.id)}
                        size={13}
                      />
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
                {(repliesMap.get(comment.id) || []).map((reply) => renderCard(reply, true))}
              </div>
            ));
          })()
        )}
      </div>
    </section>
  );
}
