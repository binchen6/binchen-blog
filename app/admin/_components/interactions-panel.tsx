"use client";

import { BarChart3, MessageCircle, Trash2 } from "lucide-react";
import { SurfacePanel } from "@/components/page-chrome";
import { toast } from "@/components/toast";
import type { CommentRow, GuestbookRow } from "./types";

export function InteractionsPanel({
  guestbook,
  setGuestbook,
  comments,
  setComments,
  authHeaders,
}: {
  guestbook: GuestbookRow[];
  setGuestbook: React.Dispatch<React.SetStateAction<GuestbookRow[]>>;
  comments: CommentRow[];
  setComments: React.Dispatch<React.SetStateAction<CommentRow[]>>;
  authHeaders: Record<string, string>;
}) {
  const deleteGuestbook = async (id: number) => {
    try {
      const res = await fetch(`/api/guestbook?id=${id}`, { method: "DELETE", headers: authHeaders });
      if (res.ok) setGuestbook((current) => current.filter((entry) => entry.id !== id));
      else toast("删除留言失败", "error");
    } catch {
      toast("网络异常，删除留言失败", "error");
    }
  };

  const deleteComment = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/comments?id=${id}`, { method: "DELETE", headers: authHeaders });
      if (res.ok) setComments((current) => current.filter((comment) => comment.id !== id));
      else toast("删除评论失败", "error");
    } catch {
      toast("网络异常，删除评论失败", "error");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <SurfacePanel className="p-6">
        <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
          <MessageCircle size={20} className="text-bronze" />
          留言管理
        </h2>
        <div className="space-y-3">
          {guestbook.map((entry) => (
            <div key={entry.id} className="border border-cyan-dark/10 bg-paper/55 p-4">
              <div className="mb-2 flex justify-between gap-3">
                <span className="font-semibold">{entry.name}</span>
                <button type="button" onClick={() => deleteGuestbook(entry.id)} className="text-cinnabar"><Trash2 size={15} /></button>
              </div>
              <p className="line-clamp-2 text-sm text-ink-light">{entry.content}</p>
            </div>
          ))}
        </div>
      </SurfacePanel>

      <SurfacePanel className="p-6">
        <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
          <BarChart3 size={20} className="text-bronze" />
          评论管理
        </h2>
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="border border-cyan-dark/10 bg-paper/55 p-4">
              <div className="mb-2 flex justify-between gap-3">
                <span className="font-semibold">{comment.name}</span>
                <button type="button" onClick={() => deleteComment(comment.id)} className="text-cinnabar"><Trash2 size={15} /></button>
              </div>
              <p className="line-clamp-2 text-sm text-ink-light">{comment.content}</p>
              <div className="mt-2 text-xs text-ink-muted">{comment.post_title || "未知文章"}</div>
            </div>
          ))}
        </div>
      </SurfacePanel>
    </div>
  );
}
