"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth, authFetch } from "@/lib/client-auth";

/** 消息铃铛：未读数角标，点击进入信箱 */
export function NotificationBell() {
  const { user, ready } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!ready || !user) {
      setUnread(0);
      return;
    }
    let cancelled = false;

    const load = async () => {
      try {
        const res = await authFetch("/api/notifications?limit=1");
        const data = (await res.json()) as { unreadCount?: number };
        if (!cancelled) setUnread(Number(data.unreadCount ?? 0));
      } catch { /* 静默失败 */ }
    };

    load();
    // 60s 轮询未读数
    const timer = setInterval(load, 60000);
    // 阅读后页面内广播刷新
    const onRefresh = () => load();
    window.addEventListener("app-notifications-read", onRefresh);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("app-notifications-read", onRefresh);
    };
  }, [ready, user]);

  if (!ready || !user) return null;

  return (
    <Link
      href="/notifications"
      className="icon-btn relative grid h-9 w-9 place-items-center text-ink-muted transition-colors hover:text-cyan-dark"
      aria-label={unread > 0 ? `信箱（${unread} 条未读）` : "信箱"}
    >
      <Bell size={17} />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-cinnabar px-1 font-mono-tech text-[10px] leading-none text-paper">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
