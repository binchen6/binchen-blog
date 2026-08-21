"use client";

import Link from "next/link";
import { Github, Mail, Rss } from "lucide-react";

const footerLinks = [
  { href: "/", label: "首页" },
  { href: "/blog", label: "文章" },
  { href: "/works", label: "作品" },
  { href: "/write", label: "撰写" },
  { href: "/guestbook", label: "留言" },
];

export default function Footer() {
  return (
    <footer className="relative z-10 mt-10">
      <img src="/assets/ink/brush-divider-2.jpg" alt="" aria-hidden="true" loading="lazy" decoding="async" className="brush-divider mb-0" />
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-5 py-10 text-center">
        <img src="/assets/ink/seal-logo.png" alt="尘墨" loading="lazy" decoding="async" className="h-12 w-12 mix-blend-multiply opacity-85" />

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="页脚导航">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="font-serif-zh text-sm tracking-[0.14em] text-ink-3 transition-colors hover:text-dai">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <a href="https://github.com/binchen6" target="_blank" rel="noopener noreferrer" className="text-ink-4 transition-colors hover:text-dai" aria-label="GitHub">
            <Github size={17} />
          </a>
          <a href="mailto:contact@cryoconite.cn" className="text-ink-4 transition-colors hover:text-cinnabar" aria-label="Email">
            <Mail size={17} />
          </a>
          <a href="/feed.xml" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-ink-4 transition-colors hover:text-gold" aria-label="RSS 订阅">
            <Rss size={17} />
            <span className="font-mono-tech text-xs">RSS</span>
          </a>
        </div>

        <p className="font-mono-tech text-xs text-ink-4">
          &copy; {new Date().getFullYear()} 尘墨 | binchen · 行到水穷处，坐看云起时
        </p>
      </div>
    </footer>
  );
}
