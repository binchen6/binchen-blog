"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { SurfacePanel } from "@/components/page-chrome";
import { useAuth, authFetch } from "@/lib/client-auth";
import { formatDate } from "@/lib/utils";

interface UnreadAnnouncement {
  id: number;
  content: string;
  created_at: string;
}

interface PublicAnnouncement {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

const DISMISS_KEY = "announcement-dismissed";

/**
 * 公告强提醒：
 * - 登录用户：未读公告直接弹窗（关闭即标记已读）
 * - 访客：顶部横幅（localStorage 记忆关闭状态）
 */
export function AnnouncementCenter() {
  const { user, ready } = useAuth();
  const [popup, setPopup] = useState<UnreadAnnouncement | null>(null);
  const [banner, setBanner] = useState<PublicAnnouncement | null>(null);

  // 登录用户：检查未读公告 → 弹窗
  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    authFetch("/api/notifications?unread_announcement=1")
      .then((res) => res.json() as Promise<{ announcements?: UnreadAnnouncement[] }>)
      .then((data) => {
        if (!cancelled && data.announcements && data.announcements.length > 0) {
          setPopup(data.announcements[0]);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  // 访客：最新公告横幅（localStorage 记忆）
  useEffect(() => {
    if (!ready || user) return;
    let cancelled = false;
    fetch("/api/announcements")
      .then((res) => res.json() as Promise<{ announcement?: PublicAnnouncement | null }>)
      .then((data) => {
        if (cancelled || !data.announcement) return;
        const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
        if (dismissed !== data.announcement.id) {
          setBanner(data.announcement);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  const closePopup = async () => {
    setPopup(null);
    // 关闭即标记所有公告为已读（失败静默，不影响关闭行为）
    try {
      await authFetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "announcement" }),
      });
      window.dispatchEvent(new Event("app-notifications-read"));
    } catch {
      /* 静默失败 */
    }
  };

  const closeBanner = () => {
    if (banner) localStorage.setItem(DISMISS_KEY, String(banner.id));
    setBanner(null);
  };

  // 弹窗内容：content 第一行是标题，其余是正文（广播时拼装格式）
  const popupTitle = popup?.content.split("\n")[0] || "站点公告";
  const popupBody = popup?.content.split("\n").slice(1).join("\n") || "";

  return (
    <>
      {/* 登录用户：未读公告弹窗 */}
      {popup && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-ink/40 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="站点公告">
          <SurfacePanel className="w-full max-w-md p-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center border border-bronze/40 bg-bronze/10 text-bronze">
                <Megaphone size={22} />
              </span>
              <div>
                <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-cyan-dark/70">Announcement</div>
                <h2 className="mt-1 font-serif-zh text-xl font-bold tracking-[0.08em]">{popupTitle}</h2>
                <div className="mt-1 font-mono-tech text-xs text-ink-muted">{formatDate(popup.created_at)}</div>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-loose text-ink-light">{popupBody}</p>
            <button type="button" onClick={closePopup} className="btn-tech mt-7 w-full">
              知道了
            </button>
          </SurfacePanel>
        </div>
      )}

      {/* 访客：顶部公告横幅 */}
      {banner && (
        <div className="fixed inset-x-0 top-16 z-40 px-4">
          <div className="mx-auto flex max-w-3xl items-center gap-3 border border-bronze/40 bg-paper/95 px-4 py-3 shadow-lg backdrop-blur-md">
            <Megaphone size={16} className="shrink-0 text-bronze" />
            <div className="min-w-0 flex-1 text-sm">
              <span className="font-semibold">{banner.title}</span>
              <span className="ml-2 text-ink-light line-clamp-1">{banner.content}</span>
            </div>
            <button type="button" onClick={closeBanner} className="shrink-0 text-ink-muted transition-colors hover:text-cinnabar" aria-label="关闭公告">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
