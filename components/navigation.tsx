"use client";

export const runtime = "edge";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Pen, MessageCircle, Menu, X, User, LogOut, Compass } from "lucide-react";

interface UserData {
  username: string;
  display_name?: string;
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? "bg-paper/90 backdrop-blur-md border-b border-cyan-dark/10 shadow-sm" 
        : "bg-transparent"
    }`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Compass size={24} className="text-bronze animate-rotate-medium" />
              <div className="absolute inset-0 bg-bronze/20 rounded-full blur-md animate-pulse-bronze" />
            </div>
            <div className="flex items-center">
              <span className="font-serif-zh text-xl font-bold tracking-widest text-ink">
                尘墨
              </span>
              <span className="mx-2 text-bronze/40">|</span>
              <span className="font-mono-tech text-xs tracking-wider text-cyan-dark uppercase">
                binchen
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                className="ink-underline text-sm font-serif-zh tracking-wider text-ink-light hover:text-ink transition-colors duration-300"
              >
                {item.label}
              </Link>
            ))}
            
            {/* Divider */}
            <div className="w-px h-4 bg-bronze/20" />
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-ink-light font-serif-zh">
                  {user.display_name || user.username}
                </span>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center space-x-1 text-sm text-ink-light hover:text-cinnabar transition-colors duration-300"
                >
                  <LogOut size={14} />
                  <span className="font-serif-zh">退出</span>
                </button>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="flex items-center space-x-1 text-sm text-ink-light hover:text-cyan-dark transition-colors duration-300"
              >
                <User size={14} />
                <span className="font-serif-zh">登录</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-ink hover:text-cyan-dark transition-colors" 
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-paper/95 backdrop-blur-lg border-b border-cyan-dark/10"
          >
            <div className="px-6 py-4 space-y-4">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className="block text-sm font-serif-zh tracking-wider text-ink-light hover:text-cyan-dark transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-mist/50 pt-4">
                {user ? (
                  <button 
                    onClick={() => { handleLogout(); setIsOpen(false); }} 
                    className="block text-sm font-serif-zh tracking-wider text-ink-light hover:text-cinnabar transition-colors py-2"
                  >
                    退出登录
                  </button>
                ) : (
                  <Link 
                    href="/login" 
                    className="block text-sm font-serif-zh tracking-wider text-ink-light hover:text-cyan-dark transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    登录
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
