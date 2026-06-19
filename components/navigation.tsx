"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Compass, LogIn, LogOut, Menu, MessageCircle, Pen, Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserData {
  username: string;
  display_name?: string;
  role?: string;
}

const navItems = [
  { href: "/", label: "首页", icon: Compass },
  { href: "/blog", label: "文章", icon: BookOpen },
  { href: "/write", label: "撰写", icon: Pen },
  { href: "/guestbook", label: "留言", icon: MessageCircle },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {
        localStorage.removeItem("user");
      }
    }

    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        scrolled ? "border-cyan-dark/10 bg-paper/90 shadow-sm backdrop-blur-md" : "border-transparent bg-paper/45 backdrop-blur-[2px]"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-3" aria-label="返回首页">
          <span className="relative grid h-9 w-9 place-items-center border border-bronze/35 bg-paper/70 text-bronze">
            <Compass size={20} className="animate-rotate-medium" />
          </span>
          <span className="flex items-baseline gap-2">
            <span className="font-serif-zh text-lg font-bold tracking-[0.2em] text-ink">尘墨</span>
            <span className="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-cyan-dark">binchen</span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group inline-flex h-10 items-center gap-2 px-3 text-sm transition-colors",
                  active ? "text-cyan-dark" : "text-ink-light hover:text-ink"
                )}
              >
                <Icon size={15} className={active ? "text-bronze" : "text-ink-muted group-hover:text-bronze"} />
                <span className="font-serif-zh tracking-[0.12em]">{item.label}</span>
                <span
                  className={cn(
                    "absolute mt-8 h-px w-8 origin-center bg-bronze transition-transform duration-300",
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  )}
                />
              </Link>
            );
          })}
          {user && ["owner", "admin"].includes(user.role || "") && (
            <Link
              href="/admin"
              className={cn(
                "group inline-flex h-10 items-center gap-2 px-3 text-sm transition-colors",
                isActive("/admin") ? "text-cyan-dark" : "text-ink-light hover:text-ink"
              )}
            >
              <Shield size={15} className={isActive("/admin") ? "text-bronze" : "text-ink-muted group-hover:text-bronze"} />
              <span className="font-serif-zh tracking-[0.12em]">控制台</span>
            </Link>
          )}

          <div className="mx-2 h-5 w-px bg-cyan-dark/10" />

          {user ? (
            <div className="flex items-center gap-3">
              <span className="max-w-[9rem] truncate text-sm text-ink-light">{user.display_name || user.username}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-9 items-center gap-2 px-2 text-sm text-ink-muted transition-colors hover:text-cinnabar"
              >
                <LogOut size={15} />
                <span>退出</span>
              </button>
            </div>
          ) : (
            <Link href="/login" className="inline-flex h-9 items-center gap-2 px-2 text-sm text-ink-muted transition-colors hover:text-cyan-dark">
              <LogIn size={15} />
              <span>登录</span>
            </Link>
          )}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center border border-cyan-dark/10 bg-paper/70 text-ink transition-colors hover:text-cyan-dark md:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "关闭菜单" : "打开菜单"}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div
        className={cn(
          "grid overflow-hidden border-t border-cyan-dark/10 bg-paper/95 backdrop-blur-lg transition-[grid-template-rows,opacity] duration-200 md:hidden",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0">
          <div className="space-y-1 px-6 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-2 py-3 text-sm",
                    isActive(item.href) ? "text-cyan-dark" : "text-ink-light"
                  )}
                >
                  <Icon size={16} className="text-bronze" />
                  <span className="font-serif-zh tracking-[0.12em]">{item.label}</span>
                </Link>
              );
            })}
            {user && ["owner", "admin"].includes(user.role || "") && (
              <Link href="/admin" className={cn("flex items-center gap-3 px-2 py-3 text-sm", isActive("/admin") ? "text-cyan-dark" : "text-ink-light")}>
                <Shield size={16} className="text-bronze" />
                <span className="font-serif-zh tracking-[0.12em]">控制台</span>
              </Link>
            )}
            <div className="mt-3 border-t border-mist/60 pt-3">
              {user ? (
                <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 px-2 py-3 text-sm text-cinnabar">
                  <LogOut size={16} />
                  <span>退出登录</span>
                </button>
              ) : (
                <Link href="/login" className="flex items-center gap-3 px-2 py-3 text-sm text-cyan-dark">
                  <LogIn size={16} />
                  <span>登录</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
