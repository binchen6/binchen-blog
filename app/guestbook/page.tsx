"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send, Trash2, User, Wind } from "lucide-react";
import { EmptyState, PageHeader, SiteShell, SurfacePanel } from "@/components/page-chrome";
import { formatDate } from "@/lib/utils";

interface GuestbookEntry {
  id: number;
  name: string;
  email: string;
  content: string;
  created_at: string;
  reply_to: number | null;
  user_id: number | null;
}

export default function GuestbookPage() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", content: "" });
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; display_name?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch {
        localStorage.removeItem("user");
      }
    }

    fetch("/api/guestbook")
      .then((res) => res.json() as Promise<{ entries?: GuestbookEntry[] }>)
      .then((data) => {
        if (!cancelled) setEntries(data.entries || []);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.content) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { entry?: GuestbookEntry };
      if (data.entry) {
        setEntries((current) => [data.entry!, ...current]);
        setForm({ name: "", email: "", content: "" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEntry = async (id: number) => {
    if (!confirm("确定删除这条留言吗？")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`/api/guestbook?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setEntries((current) => current.filter((entry) => entry.id !== id));
    else alert("删除失败");
  };

  return (
    <SiteShell>
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-28">
        <PageHeader
          eyebrow="Guestbook"
          title="留言板"
          icon={<MessageCircle size={22} />}
          description="欢迎在这里留下你的足迹。问候、建议或分享，都可以慢慢写下来。"
        />

        <SurfacePanel as="form" onSubmit={handleSubmit} className="mt-12 space-y-5 p-6 md:p-8">
          <h2 className="flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
            <Wind size={20} className="text-bronze" />
            写下你的留言
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="姓名"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-paper/60"
              required
            />
            <input
              type="email"
              placeholder="邮箱"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-paper/60"
              required
            />
          </div>
          <textarea
            placeholder="写下你的想法..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="h-36 w-full resize-none bg-paper/60"
            required
          />
          <button type="submit" disabled={submitting} className="btn-tech inline-flex items-center gap-2 disabled:opacity-50">
            <Send size={16} />
            <span>{submitting ? "提交中..." : "提交留言"}</span>
          </button>
        </SurfacePanel>

        <div className="mt-12 space-y-5">
          {loading ? (
            <div className="ink-loading mx-auto h-1 max-w-md" />
          ) : entries.length === 0 ? (
            <EmptyState title="暂无留言" description="来做第一个留言者吧。" />
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="paper-card p-6">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center border border-cyan-dark/10 bg-cyan-dark/5 text-cyan-dark">
                    <User size={16} />
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{entry.name}</div>
                    <div className="font-mono-tech text-xs text-ink-muted">{formatDate(entry.created_at)}</div>
                  </div>
                  {currentUser && entry.user_id === currentUser.id && (
                    <button type="button" onClick={() => deleteEntry(entry.id)} className="inline-flex items-center gap-1 text-xs text-cinnabar">
                      <Trash2 size={13} />
                      删除
                    </button>
                  )}
                </div>
                <p className="text-sm leading-loose text-ink-light">{entry.content}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </SiteShell>
  );
}
