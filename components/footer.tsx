"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Compass, ArrowUp, Github, Mail } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-cyan-dark/10 bg-paper-warm">
      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-bronze/30 to-transparent" />
      
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Compass className="text-bronze" size={24} />
                <div className="absolute inset-0 bg-bronze/20 rounded-full blur-sm animate-pulse-bronze" />
              </div>
              <div>
                <span className="font-serif-zh text-lg font-bold tracking-widest text-ink">
                  尘墨
                </span>
                <span className="block text-xs font-mono-tech text-cyan-dark tracking-wider mt-1">
                  CHENMO
                </span>
              </div>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">
              以笔墨记录旅途风景，以代码构建数字世界。
              <br />
              在国风与科技的交汇处，寻找一方净土。
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="https://github.com/binchen6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-ink-muted hover:text-cyan-dark transition-colors"
              >
                <Github size={18} />
              </a>
              <a 
                href="mailto:contact@cryoconite.cn" 
                className="text-ink-muted hover:text-cinnabar transition-colors"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-6">
            <h4 className="font-serif-zh text-sm font-semibold tracking-wider text-ink">
              导航
            </h4>
            <div className="space-y-3">
              {[
                { href: "/", label: "首页" },
                { href: "/blog", label: "文章" },
                { href: "/write", label: "撰写" },
                { href: "/guestbook", label: "留言板" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-ink-muted hover:text-cyan-dark transition-colors duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h4 className="font-serif-zh text-sm font-semibold tracking-wider text-ink">
              联系
            </h4>
            <p className="text-sm text-ink-muted leading-relaxed">
              欢迎通过留言板与我交流思想
              <br />
              或发送邮件探讨技术话题
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToTop}
              className="flex items-center space-x-2 text-sm text-bronze hover:text-bronze-dark transition-colors group"
            >
              <ArrowUp size={14} className="group-hover:-translate-y-1 transition-transform" />
              <span>回到顶部</span>
            </motion.button>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-mist/50">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-xs text-ink-muted">
              &copy; {new Date().getFullYear()} 尘墨 · binchen. All rights reserved.
            </p>
            <p className="text-xs text-ink-muted font-mono-tech">
              以简驭繁 · 宁静致远 · 技术为骨 · 国风为魂
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
