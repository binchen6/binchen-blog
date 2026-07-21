"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send, Trash2, User, Wind, X } from "lucide-react";
import { EmptyState, PageHeader, SiteShell, SurfacePanel } from "@/components/page-chrome";
import { toast } from "@/components/toast";
import { useDocumentTitle } from "@/lib/use-document-title";
import { cn, formatDate } from "@/lib/utils";

interface GuestbookEntry {
  id: number;
  name: string;
  email: string;
  content: string;
  created_at: string;
  reply_to: number | null;
  user_id: number | null;
  user_display_name?: string | null;
  username?: string | null;
}

export default function GuestbookPage() {
  useDocumentTitle("留言板", "欢迎来到 binchen 的留言板，问候、建议或分享，都可以慢慢写下来。");

  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", content: "" });
  const [replyTo, setReplyTo] = useState<GuestbookEntry | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; email?: string; display_name?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setCurrentUser(parsed);
        // 登录用户预填姓名与邮箱
        setForm((current) => ({
          ...current,
          name: parsed.display_name || parsed.username || "",
          email: parsed.email || "",
        }));
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

  const startReply = (entry: GuestbookEntry) => {
    setReplyTo(entry);
    document.getElementById("guestbook-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 未登录才校验姓名邮箱；登录用户由服务端取身份信息
    if (!currentUser && (!form.name || !form.email)) return;
    if (!form.content) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}),
        },
        body: JSON.stringify({ ...form, replyTo: replyTo?.id }),
      });
      const data = (await res.json()) as { entry?: GuestbookEntry };
      if (data.entry) {
        setEntries((current) => {
          if (!replyTo) return [data.entry!, ...current];
          const index = current.findIndex((item) => item.id === replyTo.id);
          if (index < 0) return [...current, data.entry!];
          const next = [...current];
          next.splice(index + 1, 0, data.entry!);
          return next;
        });
        // 登录用户保留预填的身份信息
        setForm((current) => currentUser ? { ...current, content: "" } : { name: "", email: "", content: "" });
        setReplyTo(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEntry = async (id: number) => {
    if (!confirm("确定删除这条留言吗？其回复会一并删除。")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`/api/guestbook?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      // 后端级联删除回复，前端同步移除
      setEntries((current) => current.filter((entry) => entry.id !== id && entry.reply_to !== id));
    } else toast("删除失败", "error");
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

        <SurfacePanel as="form" id="guestbook-form" onSubmit={handleSubmit} className="mt-12 space-y-5 p-6 md:p-8 scroll-mt-24">
          <div className="flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
              <Wind size={20} className="text-bronze" />
              写下你的留言
            </h2>
            {!loading && <span className="font-mono-tech text-xs text-ink-muted">共 {entries.length} 条</span>}
          </div>
          {replyTo && (
            <div className="flex items-center justify-between gap-3 border border-bronze/30 bg-bronze/10 px-3 py-2 text-xs text-ink-light">
              <span>回复 <span className="font-semibold text-bronze-dark">@{replyTo.user_display_name || replyTo.name}</span>：{replyTo.content.slice(0, 40)}{replyTo.content.length > 40 ? "…" : ""}</span>
              <button type="button" onClick={() => setReplyTo(null)} className="shrink-0 text-ink-muted transition-colors hover:text-cinnabar" aria-label="取消回复">
                <X size={14} />
              </button>
            </div>
          )}
          {currentUser ? (
            <p className="text-sm text-ink-muted">将以 <span className="text-cyan-dark">{currentUser.display_name || currentUser.username}</span> 的身份发表留言。</p>
          ) : (
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
          )}
          <textarea
            placeholder={replyTo ? "写下你的回复..." : "写下你的想法..."}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="h-36 w-full resize-none bg-paper/60"
            required
          />
          <button type="submit" disabled={submitting} className="btn-tech inline-flex items-center gap-2 disabled:opacity-50">
            <Send size={16} />
            <span>{submitting ? "提交中..." : replyTo ? "发表回复" : "提交留言"}</span>
          </button>
        </SurfacePanel>

        <div className="mt-12 space-y-5">
          {loading ? (
            <div className="ink-loading mx-auto h-1 max-w-md" />
          ) : entries.length === 0 ? (
            <EmptyState title="暂无留言" description="来做第一个留言者吧。" />
          ) : (
            (() => {
              const topLevel = entries.filter((entry) => !entry.reply_to);
              const repliesOf = (id: number) => entries.filter((entry) => entry.reply_to === id);
              const renderCard = (entry: GuestbookEntry, isReply = false) => {
                const displayName = entry.user_display_name || entry.name;
                return (
                  <div key={entry.id} className={cn("paper-card p-6", isReply && "ml-6 border-l-2 border-l-bronze/40 md:ml-10")}>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center border border-cyan-dark/10 bg-cyan-dark/5 text-cyan-dark">
                        <User size={16} />
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{displayName}</div>
                        <div className="font-mono-tech text-xs text-ink-muted">{formatDate(entry.created_at)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {!isReply && (
                          <button type="button" onClick={() => startReply(entry)} className="inline-flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-cyan-dark">
                            <MessageCircle size={13} />
                            回复
                          </button>
                        )}
                        {currentUser && entry.user_id === currentUser.id && (
                          <button type="button" onClick={() => deleteEntry(entry.id)} className="inline-flex items-center gap-1 text-xs text-cinnabar">
                            <Trash2 size={13} />
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm leading-loose text-ink-light">{entry.content}</p>
                  </div>
                );
              };
              return topLevel.map((entry) => (
                <div key={entry.id} className="space-y-3">
                  {renderCard(entry)}
                  {repliesOf(entry.id).map((reply) => renderCard(reply, true))}
                </div>
              ));
            })()
          )}
        </div>
      </section>
    </SiteShell>
  );
}
