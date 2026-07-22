"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "@/components/toast";
import { useAuth, authFetch } from "@/lib/client-auth";
import { cn } from "@/lib/utils";

type LikeButtonProps = {
  targetType: "post" | "comment";
  targetId: number;
  initialCount: number;
  initialLiked?: boolean;
  size?: number;
  className?: string;
};

/** 点赞按钮：心形 + 计数，登录才能点 */
export function LikeButton({ targetType, targetId, initialCount, initialLiked = false, size = 15, className }: LikeButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [burst, setBurst] = useState(false);

  const toggle = async () => {
    if (!user) {
      toast("请先登录后再点赞", "error");
      router.push("/login");
      return;
    }
    if (pending) return;
    setPending(true);
    // 乐观更新
    setLiked(!liked);
    setCount((current) => current + (liked ? -1 : 1));
    if (!liked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 400);
    }
    try {
      const res = await authFetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      const data = (await res.json()) as { liked?: boolean; likeCount?: number; error?: string };
      if (!res.ok) {
        // 回滚
        setLiked(liked);
        setCount((current) => current + (liked ? 1 : -1));
        toast(data.error || "操作失败", "error");
        return;
      }
      setLiked(!!data.liked);
      setCount(Number(data.likeCount ?? 0));
    } catch {
      setLiked(liked);
      setCount((current) => current + (liked ? 1 : -1));
      toast("网络异常，操作失败", "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={liked ? "取消点赞" : "点赞"}
      aria-pressed={liked}
      className={cn(
        "icon-btn inline-flex items-center gap-1.5 transition-colors disabled:opacity-60",
        liked ? "text-cinnabar" : "text-ink-muted hover:text-cinnabar",
        className
      )}
    >
      <Heart
        size={size}
        className={cn("transition-transform", liked && "fill-cinnabar", burst && "scale-125")}
      />
      <span className="font-mono-tech text-xs">{count}</span>
    </button>
  );
}
