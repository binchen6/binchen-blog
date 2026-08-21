"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Gamepad2,
  Github,
  Globe2,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { SiteShell } from "@/components/page-chrome";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useScrollReveal } from "@/lib/use-reveal";

/** 鼠标跟随光斑：只写 CSS 变量，不触发 layout */
function handleGlow(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  el.style.setProperty("--my", `${e.clientY - rect.top}px`);
}

interface WorkItem {
  title: string;
  badge: string;
  year: string;
  description: string;
  tags: string[];
  href?: string;
  external?: boolean;
  cta?: string;
  icon: ReactNode;
  accent: string;
}

const works: WorkItem[] = [
  {
    title: "地图上的裂痕",
    badge: "地理专题",
    year: "2026",
    description: "一篇可以滚动探索的交互式地理长卷——板块、裂谷与时间的刻度，在地图上徐徐展开。",
    tags: ["交互长文", "数据可视化", "独立页面"],
    href: "/geography",
    cta: "进入专题",
    icon: <Compass size={22} />,
    accent: "text-dai border-dai/30 bg-dai/5",
  },
  {
    title: "尘墨博客",
    badge: "本站",
    year: "2026",
    description: "你现在站的地方。Next.js + Cloudflare Pages + D1，自研「墨卷」设计系统，从零手搓的全栈小站。",
    tags: ["Next.js", "Edge 全栈", "设计系统"],
    href: "/blog",
    cta: "读文章",
    icon: <Globe2 size={22} />,
    accent: "text-gold border-gold/30 bg-gold/5",
  },
  {
    title: "第七频率",
    badge: "视觉小说",
    year: "2026",
    description: "一部网页视觉小说：从 218 个文件重构到 65 个，QA 评级 A。关于频率、信号与相遇的故事。",
    tags: ["视觉小说", "Web", "开源"],
    href: "https://github.com/binchen666/seventh-frequency",
    external: true,
    cta: "GitHub 仓库",
    icon: <Gamepad2 size={22} />,
    accent: "text-cinnabar border-cinnabar/30 bg-cinnabar/5",
  },
  {
    title: "小明连点器",
    badge: "桌面工具",
    year: "2026",
    description: "Windows 桌面自动化小工具：连点、配置方案、托盘常驻。18.6MB 单文件，开箱即用。",
    tags: ["C#", "Win32", "托盘工具"],
    icon: <MousePointerClick size={22} />,
    accent: "text-ink-3 border-ink-5 bg-ink-5/10",
  },
];

function WorkCard({ work, delay }: { work: WorkItem; delay: number }) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className={`inline-flex h-11 w-11 items-center justify-center border ${work.accent}`}>
          {work.icon}
        </span>
        <span className="font-mono-tech text-xs text-ink-4">
          {work.badge} · {work.year}
        </span>
      </div>
      <h3 className="mt-5 font-serif-zh text-xl font-semibold tracking-[0.06em] text-ink transition-colors group-hover:text-dai">
        {work.title}
      </h3>
      <p className="mt-3 text-sm leading-loose text-ink-3">{work.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {work.tags.map((tag) => (
          <span key={tag} className="border border-ink-5/80 px-2 py-0.5 font-mono-tech text-[11px] text-ink-4">
            {tag}
          </span>
        ))}
      </div>
      <span className={`mt-6 inline-flex items-center gap-2 text-xs ${work.href ? "text-dai" : "text-ink-4"}`}>
        {work.href ? work.cta : "未公开发布"}
        {work.href && (work.external ? <ArrowUpRight size={13} /> : <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />)}
      </span>
    </>
  );

  const cls = "work-card group p-6";
  const reveal = { "data-reveal": true, style: { transitionDelay: `${delay}ms` } } as const;

  if (work.href && work.external) {
    return (
      <a href={work.href} target="_blank" rel="noopener noreferrer" className={cls} {...reveal}>
        {inner}
      </a>
    );
  }
  if (work.href) {
    return (
      <Link href={work.href} className={cls} {...reveal}>
        {inner}
      </Link>
    );
  }
  return (
    <div className={`${cls} cursor-default`} {...reveal}>
      {inner}
    </div>
  );
}

export default function WorksPage() {
  useDocumentTitle("作品", "binchen 的个人作品架：CryClaw 桌面客户端、地理专题、视觉小说，以及这个小站本身。");
  useScrollReveal();

  return (
    <SiteShell compactDecor>
      {/* ===== 页头 ===== */}
      <section className="mx-auto max-w-5xl px-5 pb-12 pt-28 md:pt-36">
        <div className="flex items-start justify-between gap-6">
          <div data-reveal>
            <span className="font-mono-tech text-xs uppercase tracking-[0.18em] text-dai/70">Works</span>
            <h1 className="mt-3 font-serif-zh text-4xl font-bold tracking-[0.12em] text-ink md:text-6xl">作品</h1>
            <p className="mt-5 max-w-lg text-sm leading-loose text-ink-2 md:text-base">
              写代码之余做的东西，都收在这儿。能点开的，都能用。
            </p>
          </div>
          <div className="v-text hidden shrink-0 select-none text-xl text-ink-3/70 md:block" aria-hidden="true">
            造物者无止境
          </div>
        </div>
      </section>

      {/* ===== 旗舰：CryClaw ===== */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="work-featured p-8 md:p-12" data-reveal onMouseMove={handleGlow}>
          <div className="work-featured__glow" aria-hidden="true" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto] md:gap-10">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 border border-[#b8933f]/40 bg-[#b8933f]/10 px-2.5 py-1 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#d8b96a]">
                  <Sparkles size={12} />
                  Flagship
                </span>
                <span className="font-mono-tech text-xs text-[#8f8774]">桌面应用 · 2026 · 持续更新</span>
              </div>
              <h2 className="mt-5 font-serif-zh text-3xl font-bold tracking-[0.08em] text-[#f3edde] md:text-4xl">
                CryClaw
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-loose text-[#c9c0ab] md:text-base">
                高效、易用、纯净的 OpenClaw 桌面客户端。一分钟装好，即刻开聊——零配置、零依赖，487 个测试用例全绿。
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Electron", "TypeScript", "双通道自动更新", "≈0.6s 冷启动"].map((chip) => (
                  <span key={chip} className="border border-white/10 bg-white/5 px-2.5 py-1 font-mono-tech text-[11px] text-[#b8b09c]">
                    {chip}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/CryClaw"
                  className="inline-flex items-center gap-2 bg-[#b8933f] px-5 py-2.5 text-sm font-medium text-[#171410] transition-colors hover:bg-[#cfa64f]"
                >
                  进入产品页
                  <ArrowRight size={14} />
                </Link>
                <a
                  href="https://github.com/binchen6/CryoClaw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-white/20 px-5 py-2.5 text-sm text-[#f3edde] transition-colors hover:border-[#b8933f]/60 hover:text-[#d8b96a]"
                >
                  <Github size={15} />
                  GitHub
                </a>
              </div>
            </div>
            <img
              src="/CryClaw/assets/icon.png"
              alt="CryClaw 应用图标"
              loading="lazy"
              decoding="async"
              className="work-icon mx-auto w-24 animate-float md:w-36"
            />
          </div>
        </div>
      </section>

      {/* ===== 更多作品 ===== */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="mb-8 flex items-end justify-between" data-reveal>
          <div>
            <span className="font-mono-tech text-xs uppercase tracking-[0.18em] text-dai/70">More</span>
            <h2 className="mt-2 font-serif-zh text-2xl font-bold tracking-[0.1em]">也做了这些</h2>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {works.map((work, i) => (
            <WorkCard key={work.title} work={work} delay={i * 70} />
          ))}
        </div>
      </section>

      {/* ===== 尾注 ===== */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <p className="border-t border-ink-5/60 pt-8 text-center font-mono-tech text-xs text-ink-4" data-reveal>
          作品持续增加中 —— 下一个想法已经在草稿箱。
        </p>
      </section>
    </SiteShell>
  );
}
