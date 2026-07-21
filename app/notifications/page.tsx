"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSign, Bell, CheckCheck, Heart, Megaphone, MessageCircle, MessagesSquare, UserPlus } from "lucide-react";
import { EmptyState, PageHeader, SiteShell, SurfacePanel } from "@/components/page-chrome";
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

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.push("/login");
      return;
    }
    let cancelled = false;
    authFetch("/api/notifications?limit=50")
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

  const markAllRead = async () => {
    const res = await authFetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    if (res.ok) {
      setItems((current) => current.map((item) => ({ ...item, is_read: 1 })));
      setUnreadCount(0);
      window.dispatchEvent(new Event("app-notifications-read"));
      toast("已全部标记为已读");
    }
  };

  const openNotification = async (item: NotificationItem) => {
    if (!item.is_read) {
      authFetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: 1 } : entry));
      setUnreadCount((current) => Math.max(0, current - 1));
      window.dispatchEvent(new Event("app-notifications-read"));
    }
    if (item.link) router.push(item.link);
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
          description="提及、回复、点赞、关注与公告都会安静地躺在这里。"
        />

        <div className="mt-8 flex items-center justify-between">
          <span className="font-mono-tech text-xs text-ink-muted">
            {unreadCount > 0 ? `${unreadCount} 条未读` : "没有未读消息"}
          </span>
          {unreadCount > 0 && (
            <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1.5 text-xs text-cyan-dark transition-colors hover:text-bronze">
              <CheckCheck size={14} />
              全部已读
            </button>
          )}
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="ink-loading mx-auto h-1 max-w-md" />
          ) : items.length === 0 ? (
            <EmptyState title="信箱空空如也" description="当有人与你互动时，消息会出现在这里。" />
          ) : (
            items.map((item) => {
              const meta = TYPE_META[item.type] || TYPE_META.comment;
              const Icon = meta.icon;
              const inner = (
                <>
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center border border-cyan-dark/10 bg-paper/70", meta.className)}>
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{item.actor_name}</span>
                      <span className="border border-mist px-1.5 py-px text-[10px] text-ink-muted">{meta.label}</span>
                      {!item.is_read && <span className="h-1.5 w-1.5 rounded-full bg-cinnabar" />}
                    </span>
                    <span className="mt-1 block truncate text-sm text-ink-light">{item.content}</span>
                    <span className="mt-1 block font-mono-tech text-xs text-ink-muted">{formatDate(item.created_at)}</span>
                  </span>
                </>
              );
              return item.link ? (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openNotification(item)}
                  className={cn(
                    "paper-card flex w-full items-start gap-3 p-4 text-left transition-colors",
                    !item.is_read && "border-l-2 border-l-cinnabar/60"
                  )}
                >
                  {inner}
                </button>
              ) : (
                <div
                  key={item.id}
                  className={cn(
                    "paper-card flex items-start gap-3 p-4",
                    !item.is_read && "border-l-2 border-l-cinnabar/60"
                  )}
                >
                  {inner}
                </div>
              );
            })
          )}
        </div>
      </section>
    </SiteShell>
  );
}
