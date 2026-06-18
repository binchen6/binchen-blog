"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Pen, MessageCircle, Menu, X, User, LogOut } from "lucide-react";

interface UserData {
  username: string;
  display_name?: string;
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  const navItems = [
    { href: "/", label: "首页" },
    { href: "/blog", label: "文章", icon: BookOpen },
    { href: "/write", label: "撰写", icon: Pen },
    { href: "/guestbook", label: "留言", icon: MessageCircle },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/80 backdrop-blur-sm border-b border-ink/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-serif-zh text-xl font-bold tracking-widest text-ink">尘</span>
            <span className="text-stone text-sm">|</span>
            <span className="font-serif-zh text-sm tracking-wider text-ink-light">binchen</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="ink-underline text-sm font-serif-zh tracking-wider text-ink-light hover:text-ink transition-colors">
                {item.label}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-ink-light">{user.display_name || user.username}</span>
                <button onClick={handleLogout} className="flex items-center space-x-1 text-sm text-ink-light hover:text-ink transition-colors">
                  <LogOut size={16} />
                  <span className="font-serif-zh">退出</span>
                </button>
              </div>
            ) : (
              <Link href="/login" className="flex items-center space-x-1 text-sm text-ink-light hover:text-ink transition-colors">
                <User size={16} />
                <span className="font-serif-zh">登录</span>
              </Link>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-paper border-b border-ink/5"
          >
            <div className="px-6 py-4 space-y-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="block text-sm font-serif-zh tracking-wider text-ink-light hover:text-ink transition-colors" onClick={() => setIsOpen(false)}>
                  {item.label}
                </Link>
              ))}
              {user ? (
                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="block text-sm font-serif-zh tracking-wider text-ink-light hover:text-ink transition-colors">
                  退出登录
                </button>
              ) : (
                <Link href="/login" className="block text-sm font-serif-zh tracking-wider text-ink-light hover:text-ink transition-colors" onClick={() => setIsOpen(false)}>
                  登录
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
