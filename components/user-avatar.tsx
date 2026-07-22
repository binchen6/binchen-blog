"use client";

import { memo } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  username?: string | null;
  avatar?: string | null;
  size?: number;
  linkToProfile?: boolean;
  className?: string;
};

/**
 * 统一头像组件：有头像显示图片，无头像显示占位图标。
 * linkToProfile=true 且用户名存在时，点击跳转公开主页。
 */
// memo：纯展示组件，常在评论/文章列表中被父组件高频重渲染波及
export const UserAvatar = memo(function UserAvatar({ username, avatar, size = 36, linkToProfile = true, className }: UserAvatarProps) {
  const inner = avatar ? (
    <img
      src={avatar}
      alt={username || "用户头像"}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover"
    />
  ) : (
    <span className="grid h-full w-full place-items-center text-cyan-dark">
      <User size={Math.round(size * 0.45)} />
    </span>
  );

  const baseClass = cn(
    "block shrink-0 overflow-hidden border border-cyan-dark/10 bg-cyan-dark/5 transition-colors",
    className
  );

  const style = { width: size, height: size };

  if (linkToProfile && username) {
    return (
      <Link
        href={`/users/${encodeURIComponent(username)}`}
        className={cn(baseClass, "hover:border-bronze")}
        style={style}
        aria-label={`查看 ${username} 的主页`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <span className={baseClass} style={style}>
      {inner}
    </span>
  );
});
