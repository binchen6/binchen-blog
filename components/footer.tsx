"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Compass, ArrowUp } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-ink/5 bg-paper-warm">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Compass className="text-bronze" size={20} />
              <span className="font-serif-zh text-lg font-bold tracking-widest">
                binchen
              </span>
            </div>
            <p className="text-sm text-ink-light leading-relaxed">
              喜欢自由与宁静地生活旅行者
              <br />
              以文字记录旅途中的风景与思考
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="font-serif-zh text-sm font-semibold tracking-wider">
              导航
            </h4>
            <div className="space-y-2">
              {[
                { href: "/", label: "首页" },
                { href: "/blog", label: "文章" },
                { href: "/write", label: "撰写" },
                { href: "/guestbook", label: "留言板" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-ink-light hover:text-ink transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-serif-zh text-sm font-semibold tracking-wider">
              联系
            </h4>
            <p className="text-sm text-ink-light">
              欢迎通过留言板与我交流
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToTop}
              className="flex items-center space-x-2 text-sm text-bronze hover:text-bronze-light transition-colors"
            >
              <ArrowUp size={16} />
              <span>回到顶部</span>
            </motion.button>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-ink/5 text-center">
          <p className="text-xs text-stone">
            &copy; {new Date().getFullYear()} binchen. All rights reserved.
          </p>
          <p className="text-xs text-stone mt-1">
            以简驭繁 · 宁静致远
          </p>
        </div>
      </div>
    </footer>
  );
}
