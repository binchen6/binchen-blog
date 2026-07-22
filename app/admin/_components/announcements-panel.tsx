"use client";

import { useState } from "react";
import { Megaphone, Trash2 } from "lucide-react";
import { SurfacePanel } from "@/components/page-chrome";
import { toast } from "@/components/toast";
import { formatDate } from "@/lib/utils";
import type { AnnouncementRow } from "./types";

export function AnnouncementsPanel({
  announcements,
  setAnnouncements,
  authHeaders,
}: {
  announcements: AnnouncementRow[];
  setAnnouncements: React.Dispatch<React.SetStateAction<AnnouncementRow[]>>;
  authHeaders: Record<string, string>;
}) {
  const [form, setForm] = useState({ title: "", content: "" });
  const [sending, setSending] = useState(false);

  const sendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast("请填写公告标题和内容", "error");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { announcement?: AnnouncementRow; notified?: number; error?: string };
      if (!res.ok || !data.announcement) {
        toast(data.error || "公告发送失败", "error");
        return;
      }
      setAnnouncements((current) => [data.announcement!, ...current]);
      setForm({ title: "", content: "" });
      toast(`公告已发送，通知了 ${data.notified ?? 0} 位用户`);
    } catch {
      toast("网络异常，公告发送失败", "error");
    } finally {
      setSending(false);
    }
  };

  const deleteAnnouncement = async (id: number) => {
    if (!confirm("确定删除这条公告吗？所有用户信箱中的该公告也会一并移除。")) return;
    try {
      const res = await fetch(`/api/announcements?id=${id}`, { method: "DELETE", headers: authHeaders });
      if (res.ok) setAnnouncements((current) => current.filter((item) => item.id !== id));
      else toast("删除公告失败", "error");
    } catch {
      toast("网络异常，删除公告失败", "error");
    }
  };

  return (
    <div className="space-y-8">
      <SurfacePanel as="form" onSubmit={sendAnnouncement} className="space-y-5 p-6">
        <h2 className="flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
          <Megaphone size={20} className="text-bronze" />
          发布公告
        </h2>
        <p className="text-sm text-ink-muted">公告会广播给所有注册用户：登录用户首次接收直接弹窗，访客在首页看到横幅。</p>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full bg-paper/60"
          placeholder="公告标题（80 字以内）"
          maxLength={80}
          required
        />
        <textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="h-32 w-full resize-none bg-paper/60"
          placeholder="公告内容..."
          maxLength={2000}
          required
        />
        <button type="submit" disabled={sending} className="btn-tech inline-flex items-center gap-2 disabled:opacity-50">
          <Megaphone size={16} />
          {sending ? "发送中..." : "发布公告"}
        </button>
      </SurfacePanel>

      <SurfacePanel className="p-6">
        <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
          <Megaphone size={20} className="text-bronze" />
          历史公告（{announcements.length}）
        </h2>
        {announcements.length === 0 ? (
          <p className="text-sm text-ink-muted">还没有发布过公告。</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div key={item.id} className="border border-cyan-dark/10 bg-paper/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{item.title}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-tech text-xs text-ink-muted">{formatDate(item.created_at)}</span>
                    <button type="button" onClick={() => deleteAnnouncement(item.id)} className="text-cinnabar transition-colors hover:text-cinnabar-dark" aria-label="删除公告">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-loose text-ink-light">{item.content}</p>
                <div className="mt-2 text-xs text-ink-muted">发布人：{item.created_by_name || item.created_by_username || "未知"}</div>
              </div>
            ))}
          </div>
        )}
      </SurfacePanel>
    </div>
  );
}
