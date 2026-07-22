"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSign, Bell, CheckCheck, ChevronDown, Heart, Megaphone, MessageCircle, MessagesSquare, Trash2, UserPlus, X } from "lucide-react";
import { EmptyState, PageHeader, SiteShell } from "@/components/page-chrome";
import { toast } from "@/components/toast";
import { useAuth, authFetch } from "@/lib/client-auth";
import { useDocumentTitle } from "@/lib/use-document-title";
import { cn, formatDate } from "@/lib/utils";

interface NotificationItem {
  id: number;
  type: "mention" | "reply" | "comment" | "guestbook" | "like" | "follow" | "announcement";
  actor_id: number | null;
  actor_name: string;
  target_type: string | null;
  target_id: number | null;
  link: string;
  content: string;
  is_read: number;
  created_at: string;
}

const TYPE_META: Record<string, { icon: typeof Heart; label: string; className: string }> = {
  mention: { icon: AtSign, label: "提及", className: "text-cinnabar" },
  reply: { icon: MessagesSquare, label: "回复", className: "text-cyan-dark" },
  comment: { icon: MessageCircle, label: "评论", className: "text-cyan-dark" },
  guestbook: { icon: MessageCircle, label: "留言", className: "text-cyan-dark" },
  like: { icon: Heart, label: "点赞", className: "text-cinnabar" },
  follow: { icon: UserPlus, label: "关注", className: "text-bronze-dark" },
  announcement: { icon: Megaphone, label: "公告", className: "text-bronze-dark" },
};

export default function NotificationsPage() {
  useDocumentTitle("信箱");
  const router = useRouter();
  const { user, ready } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const refreshUnreadEvent = () => window.dispatchEvent(new Event("app-notifications-read"));

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.push("/login");
      return;
    }
    let cancelled = false;
    authFetch("/api/notifications?limit=30")
      .then((res) => res.json() as Promise<{ notifications?: NotificationItem[]; unreadCount?: number }>)
      .then((data) => {
        if (cancelled) return;
        setItems(data.notifications || []);
        setUnreadCount(Number(data.unreadCount ?? 0));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, user, router]);

  const markRead = (id: number) => {
    authFetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {}); // 已读标记失败不打扰用户，下次进入会重新同步
    setItems((current) => current.map((entry) => entry.id === id ? { ...entry, is_read: 1 } : entry));
    setUnreadCount((current) => Math.max(0, current - 1));
    refreshUnreadEvent();
  };

  const markAllRead = async () => {
    try {
      const res = await authFetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setItems((current) => current.map((item) => ({ ...item, is_read: 1 })));
        setUnreadCount(0);
        refreshUnreadEvent();
        toast("已全部标记为已读");
      } else {
        toast("操作失败", "error");
      }
    } catch {
      toast("网络异常，操作失败", "error");
    }
  };

  // 点击消息：公告类展开详情；带链接的标记已读后跳转
  const openItem = (item: NotificationItem) => {
    if (selectMode) {
      toggleSelect(item.id);
      return;
    }
    if (!item.is_read) markRead(item.id);
    if (item.link) {
      router.push(item.link);
    } else {
      setExpandedId((current) => (current === item.id ? null : item.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((current) => (current.size === items.length ? new Set() : new Set(items.map((item) => item.id))));
  };

  const deleteOne = async (id: number) => {
    try {
      const res = await authFetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        const target = items.find((item) => item.id === id);
        setItems((current) => current.filter((item) => item.id !== id));
        if (target && !target.is_read) setUnreadCount((current) => Math.max(0, current - 1));
        refreshUnreadEvent();
        toast("已删除");
      } else {
        toast("删除失败", "error");
      }
    } catch {
      toast("网络异常，删除失败", "error");
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`确定删除选中的 ${selected.size} 条消息吗？`)) return;
    try {
      const res = await authFetch(`/api/notifications?ids=${Array.from(selected).join(",")}`, { method: "DELETE" });
      if (res.ok) {
        const deletedUnread = items.filter((item) => selected.has(item.id) && !item.is_read).length;
        setItems((current) => current.filter((item) => !selected.has(item.id)));
        setUnreadCount((current) => Math.max(0, current - deletedUnread));
        setSelected(new Set());
        setSelectMode(false);
        refreshUnreadEvent();
        toast("已删除所选消息");
      } else {
        toast("删除失败", "error");
      }
    } catch {
      toast("网络异常，删除失败", "error");
    }
  };

  if (!ready || !user) {
    return (
      <SiteShell>
        <section className="px-6 pb-20 pt-28">
          <div className="ink-loading mx-auto h-1 max-w-md" />
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-28">
        <PageHeader
          eyebrow="Inbox"
          title="信箱"
          icon={<Bell size={22} />}
          description="提及、回复、点赞、关注与公告都会安静地躺在这里。只保留最近 30 条。"
        />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono-tech text-xs text-ink-muted">
            {unreadCount > 0 ? `${unreadCount} 条未读` : "没有未读消息"}
          </span>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1.5 text-xs text-cyan-dark transition-colors hover:text-bronze">
                <CheckCheck size={14} />
                全部已读
              </button>
            )}
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectMode((value) => !value);
                  setSelected(new Set());
                }}
                className={cn("inline-flex items-center gap-1.5 text-xs transition-colors", selectMode ? "text-cinnabar" : "text-ink-muted hover:text-cyan-dark")}
              >
                {selectMode ? <X size={14} /> : <Trash2 size={14} />}
                {selectMode ? "取消" : "管理"}
              </button>
            )}
          </div>
        </div>

        {/* 选择模式工具栏 */}
        {selectMode && (
          <div className="mt-4 flex items-center justify-between border border-bronze/30 bg-bronze/10 px-4 py-2.5">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-ink-light">
              <input
                type="checkbox"
                checked={selected.size === items.length && items.length > 0}
                onChange={toggleSelectAll}
                className="h-3.5 w-3.5 accent-cyan-dark"
              />
              全选（{selected.size}/{items.length}）
            </label>
            <button
              type="button"
              onClick={deleteSelected}
              disabled={selected.size === 0}
              className="inline-flex items-center gap-1.5 text-xs text-cinnabar transition-colors disabled:opacity-40"
            >
              <Trash2 size={14} />
              删除所选
            </button>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="ink-loading mx-auto h-1 max-w-md" />
          ) : items.length === 0 ? (
            <EmptyState title="信箱空空如也" description="当有人与你互动时，消息会出现在这里。" />
          ) : (
            items.map((item) => {
              const meta = TYPE_META[item.type] || TYPE_META.comment;
              const Icon = meta.icon;
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "paper-card transition-colors",
                    !item.is_read && "border-l-2 border-l-cinnabar/60",
                    selectMode && selected.has(item.id) && "ring-1 ring-cyan-dark/40"
                  )}
                >
                  <div className="flex items-start gap-3 p-4">
                    {selectMode && (
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2.5 h-4 w-4 shrink-0 accent-cyan-dark"
                        aria-label="选择这条消息"
                      />
                    )}
                    <button type="button" onClick={() => openItem(item)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                      <span className={cn("grid h-9 w-9 shrink-0 place-items-center border border-cyan-dark/10 bg-paper/70", meta.className)}>
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-sm">
                          <span className="font-semibold">{item.actor_name}</span>
                          <span className="border border-mist px-1.5 py-px text-[10px] text-ink-muted">{meta.label}</span>
                          {!item.is_read && <span className="h-1.5 w-1.5 rounded-full bg-cinnabar" />}
                        </span>
                        <span className={cn("mt-1 block text-sm text-ink-light", !isExpanded && "truncate")}>
                          {isExpanded ? item.content : item.content.split("\n")[0]}
                        </span>
                        <span className="mt-1 flex items-center gap-2 font-mono-tech text-xs text-ink-muted">
                          {formatDate(item.created_at)}
                          {!item.link && (
                            <ChevronDown size={12} className={cn("transition-transform", isExpanded && "rotate-180")} />
                          )}
                        </span>
                      </span>
                    </button>
                    {!selectMode && (
                      <button
                        type="button"
                        onClick={() => deleteOne(item.id)}
                        className="shrink-0 text-ink-muted transition-colors hover:text-cinnabar"
                        aria-label="删除这条消息"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  {isExpanded && item.content.includes("\n") && (
                    <div className="border-t border-mist/60 px-4 py-3 text-sm leading-loose text-ink-light">
                      {item.content.split("\n").slice(1).join("\n")}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </SiteShell>
  );
}
