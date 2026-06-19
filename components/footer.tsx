"use client";

import Link from "next/link";
import { ArrowUp, Compass, Github, Mail } from "lucide-react";

const footerLinks = [
  { href: "/", label: "首页" },
  { href: "/blog", label: "文章" },
  { href: "/write", label: "撰写" },
  { href: "/guestbook", label: "留言板" },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative z-10 border-t border-cyan-dark/10 bg-paper-warm/85">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bronze/40 to-transparent" />
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.3fr_0.7fr_1fr]">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center border border-bronze/35 bg-paper/60 text-bronze">
              <Compass size={22} />
            </span>
            <div>
              <div className="font-serif-zh text-lg font-bold tracking-[0.18em] text-ink">尘墨</div>
              <div className="font-mono-tech text-[11px] uppercase tracking-[0.18em] text-cyan-dark">binchen</div>
            </div>
          </div>
          <p className="max-w-sm text-sm leading-loose text-ink-muted">
            记录生活、旅行与技术之间的细微光线，在自由与宁静里保持清醒。
          </p>
          <div className="mt-5 flex items-center gap-4">
            <a href="https://github.com/binchen6" target="_blank" rel="noopener noreferrer" className="text-ink-muted transition-colors hover:text-cyan-dark" aria-label="GitHub">
              <Github size={18} />
            </a>
            <a href="mailto:contact@cryoconite.cn" className="text-ink-muted transition-colors hover:text-cinnabar" aria-label="Email">
              <Mail size={18} />
            </a>
          </div>
        </div>

        <div>
          <h2 className="mb-5 font-serif-zh text-sm font-semibold tracking-[0.14em] text-ink">导航</h2>
          <div className="space-y-3">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="block text-sm text-ink-muted transition-colors hover:text-cyan-dark">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-5 font-serif-zh text-sm font-semibold tracking-[0.14em] text-ink">联系</h2>
          <p className="text-sm leading-loose text-ink-muted">
            欢迎通过留言板交流想法，也可以用邮件聊聊旅行、创作或技术。
          </p>
          <button
            type="button"
            onClick={scrollToTop}
            className="mt-5 inline-flex items-center gap-2 text-sm text-bronze transition-colors hover:text-bronze-dark"
          >
            <ArrowUp size={15} />
            <span>回到顶部</span>
          </button>
        </div>
      </div>

      <div className="border-t border-mist/60 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs text-ink-muted md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} 尘墨 | binchen. All rights reserved.</p>
          <p className="font-mono-tech">quiet life · free travel · ancient tech</p>
        </div>
      </div>
    </footer>
  );
}
