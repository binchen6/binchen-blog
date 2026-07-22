"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, Compass, Home, LogIn, LogOut, MessageCircle, Pen, User, X } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@/lib/client-auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/blog", label: "文章", icon: BookOpen },
  { href: "/write", label: "撰写", icon: Pen },
  { href: "/guestbook", label: "留言", icon: MessageCircle },
];

export default function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // 文章详情页（触屏）用底部操作栏替代全局 tab bar
  const isArticlePage = pathname?.startsWith("/blog/") && pathname !== "/blog";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <>
      {/* ===== 桌面/通用顶栏 ===== */}
      <nav
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled ? "border-b border-ink-5 bg-paper/92 shadow-sm backdrop-blur-md" : "bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="返回首页">
            <img src="/assets/ink/seal-logo.png" alt="尘墨" decoding="async" className="h-9 w-9 mix-blend-multiply transition-transform group-hover:rotate-[-3deg]" />
            <span className="font-serif-zh text-lg font-bold tracking-[0.24em] text-ink">尘墨</span>
          </Link>

          {/* 桌面横排导航 */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3.5 py-2 font-serif-zh text-sm tracking-[0.14em] transition-colors",
                    active ? "text-cinnabar" : "text-ink-2 hover:text-ink"
                  )}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-cinnabar/70" />}
                </Link>
              );
            })}
            {user && ["owner", "admin"].includes(user.role || "") && (
              <Link
                href="/admin"
                className={cn(
                  "px-3.5 py-2 font-serif-zh text-sm tracking-[0.14em] transition-colors",
                  isActive("/admin") ? "text-cinnabar" : "text-ink-2 hover:text-ink"
                )}
              >
                控制台
              </Link>
            )}

            <div className="mx-2 h-5 w-px bg-ink-5" />
            <NotificationBell />

            {user ? (
              <div className="flex items-center gap-2.5">
                <Link href="/profile" className="flex max-w-[10rem] items-center gap-2 truncate text-sm text-ink-2 transition-colors hover:text-dai">
                  <UserAvatar username={null} avatar={user.avatar} size={26} linkToProfile={false} className="!rounded-full" />
                  <span className="truncate">{user.display_name || user.username}</span>
                </Link>
                <button type="button" onClick={handleLogout} className="inline-flex h-9 items-center gap-1.5 text-sm text-ink-4 transition-colors hover:text-cinnabar" aria-label="退出登录">
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <Link href="/login" className="inline-flex h-9 items-center gap-1.5 px-2 text-sm text-ink-3 transition-colors hover:text-dai">
                <LogIn size={15} />
                <span>登录</span>
              </Link>
            )}
          </div>

          {/* 移动端：铃铛 + 用户菜单按钮 */}
          <div className="flex items-center gap-1 md:hidden">
            <NotificationBell />
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center text-ink-2"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
            >
              {menuOpen ? <X size={20} /> : user ? <UserAvatar username={null} avatar={user.avatar} size={24} linkToProfile={false} className="!rounded-full" /> : <User size={20} />}
            </button>
          </div>
        </div>

        {/* 移动端用户菜单（顶栏下拉） */}
        {menuOpen && (
          <div className="border-t border-ink-5 bg-paper/97 px-5 py-3 backdrop-blur-lg md:hidden">
            {user ? (
              <div className="space-y-1">
                <Link href="/profile" className="block py-2.5 text-sm text-ink-2">个人中心</Link>
                <Link href="/notifications" className="flex items-center gap-2 py-2.5 text-sm text-ink-2">
                  <Bell size={15} />
                  信箱
                </Link>
                {["owner", "admin"].includes(user.role || "") && (
                  <Link href="/admin" className="block py-2.5 text-sm text-ink-2">控制台</Link>
                )}
                <button type="button" onClick={handleLogout} className="block w-full py-2.5 text-left text-sm text-cinnabar">退出登录</button>
              </div>
            ) : (
              <Link href="/login" className="block py-2.5 text-sm text-dai">登录 / 注册</Link>
            )}
          </div>
        )}
      </nav>

      {/* ===== 移动端底部 tab bar（文章详情页隐藏，让位给操作栏） ===== */}
      {!isArticlePage && (
        <nav className="tab-bar md:hidden" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn("tab-bar__item", active && "tab-bar__item--active")}>
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
