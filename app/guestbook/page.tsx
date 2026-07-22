"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Send, Trash2, Wind, X } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader, SiteShell, SurfacePanel } from "@/components/page-chrome";
import { toast } from "@/components/toast";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth, authFetch } from "@/lib/client-auth";
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
  user_avatar?: string | null;
}

export default function GuestbookPage() {
  useDocumentTitle("留言板", "欢迎来到 binchen 的留言板，问候、建议或分享，都可以慢慢写下来。");

  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", content: "" });
  const [replyTo, setReplyTo] = useState<GuestbookEntry | null>(null);
  const { user: currentUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // 留言按楼层分组：一次遍历建 Map，替代渲染期每条全表 filter 的 O(n²)
  const groupedEntries = useMemo(() => {
    const topLevel: GuestbookEntry[] = [];
    const repliesMap = new Map<number, GuestbookEntry[]>();
    entries.forEach((entry) => {
      if (!entry.reply_to) {
        topLevel.push(entry);
        return;
      }
      const bucket = repliesMap.get(entry.reply_to);
      if (bucket) bucket.push(entry);
      else repliesMap.set(entry.reply_to, [entry]);
    });
    return { topLevel, repliesMap };
  }, [entries]);

  useEffect(() => {
    let cancelled = false;

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
      const res = await authFetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, replyTo: replyTo?.id }),
      });
      const data = (await res.json()) as { entry?: GuestbookEntry };
      if (!res.ok || !data.entry) {
        toast("留言提交失败，请稍后重试", "error");
        return;
      }
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
    } catch {
      toast("网络异常，留言提交失败", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEntry = async (id: number) => {
    if (!confirm("确定删除这条留言吗？其回复会一并删除。")) return;
    try {
      const res = await authFetch(`/api/guestbook?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        // 后端级联删除回复，前端同步移除
        setEntries((current) => current.filter((entry) => entry.id !== id && entry.reply_to !== id));
      } else toast("删除失败", "error");
    } catch {
      toast("网络异常，删除失败", "error");
    }
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
              const { topLevel, repliesMap } = groupedEntries;
              const renderCard = (entry: GuestbookEntry, isReply = false) => {
                const displayName = entry.user_display_name || entry.name;
                return (
                  <div key={entry.id} className={cn("paper-card p-6", isReply && "ml-6 border-l-2 border-l-bronze/40 md:ml-10")}>
                    <div className="mb-3 flex items-center gap-3">
                      <UserAvatar username={entry.username} avatar={entry.user_avatar} size={36} />
                      <div className="flex-1">
                        <div className="text-sm font-semibold">
                          {entry.username ? (
                            <Link href={`/users/${encodeURIComponent(entry.username)}`} className="transition-colors hover:text-cyan-dark">
                              {displayName}
                            </Link>
                          ) : (
                            displayName
                          )}
                        </div>
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
                  {(repliesMap.get(entry.id) || []).map((reply) => renderCard(reply, true))}
                </div>
              ));
            })()
          )}
        </div>
      </section>
    </SiteShell>
  );
}
