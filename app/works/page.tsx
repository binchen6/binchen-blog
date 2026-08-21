"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CSSProperties, MouseEvent } from "react";
import { ArrowRight, ArrowUpRight, Github } from "lucide-react";
import { SiteShell } from "@/components/page-chrome";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useScrollReveal } from "@/lib/use-reveal";
import { DEFAULT_WORKS, WORK_ACCENTS, WORK_ICONS } from "@/lib/works-defaults";
import type { WorkItem } from "@/lib/works-defaults";

/** 鼠标跟随光斑：只写 CSS 变量，不触发 layout */
function handleGlow(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  el.style.setProperty("--my", `${e.clientY - rect.top}px`);
}

function WorkGlyph({ work, size }: { work: WorkItem; size: number }) {
  if (work.icon.startsWith("/")) {
    return <img src={work.icon} alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-full w-full object-contain" />;
  }
  const Icon = WORK_ICONS[work.icon] ?? WORK_ICONS.sparkles;
  return <Icon size={size} />;
}

function tagList(work: WorkItem, max = 3): string[] {
  return work.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, max);
}

function WorkCard({ work, delay }: { work: WorkItem; delay: number }) {
  const accent = WORK_ACCENTS[work.accent] ?? WORK_ACCENTS.dai;
  const inner = (
    <>
      {work.cover ? (
        <div className="work-thumb">
          <img src={work.cover} alt="" aria-hidden="true" loading="lazy" decoding="async" />
        </div>
      ) : (
        <span className={`work-thumb grid place-items-center border ${accent}`}>
          <WorkGlyph work={work} size={22} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono-tech text-[11px] text-ink-4">
            {work.badge}{work.year ? ` · ${work.year}` : ""}
          </span>
        </div>
        <h3 className="mt-2 font-serif-zh text-lg font-semibold tracking-[0.05em] text-ink transition-colors group-hover:text-dai">
          {work.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-3">{work.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {tagList(work).map((tag) => (
            <span key={tag} className="font-mono-tech text-[11px] text-ink-4">
              {tag}
            </span>
          ))}
          <span className={`inline-flex items-center gap-1.5 text-xs ${work.href ? "text-dai" : "text-ink-4"}`}>
            {work.href ? work.cta || "去看看" : "未公开发布"}
            {work.href && (work.external === 1 ? <ArrowUpRight size={13} /> : <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />)}
          </span>
        </div>
      </div>
    </>
  );

  const cls = "work-card group flex gap-5 p-5";
  const reveal = { "data-reveal": true, style: { transitionDelay: `${delay}ms` } as CSSProperties };

  if (work.href && work.external === 1) {
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
  useDocumentTitle("作品", "binchen 的个人作品架：CryoClaw 桌面客户端、地理专题、视觉小说，以及这个小站本身。");
  const [works, setWorks] = useState<WorkItem[]>(DEFAULT_WORKS);
  useScrollReveal([works.length]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/works")
      .then((res) => res.json() as Promise<{ works?: WorkItem[] }>)
      .then((data) => {
        if (!cancelled && data.works && data.works.length > 0) setWorks(data.works);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = works.find((w) => w.featured === 1) ?? works[0];
  const rest = works.filter((w) => w !== featured);

  return (
    <SiteShell compactDecor>
      {/* ===== 页头 ===== */}
      <section className="mx-auto max-w-5xl px-5 pb-12 pt-28 md:pt-36">
        <div data-reveal>
          <span className="t-eyebrow">Works</span>
          <h1 className="mt-3 font-serif-zh text-4xl font-bold tracking-[0.12em] text-ink md:text-6xl">作品</h1>
          <p className="mt-5 max-w-lg text-sm leading-loose text-ink-2 md:text-base">
            写代码之余做的东西，都收在这儿。能点开的，都能用。
          </p>
        </div>
      </section>

      {/* ===== 旗舰 ===== */}
      {featured && (
        <section className="mx-auto max-w-5xl px-5 pb-14">
          <div className="work-featured p-8 md:p-12" data-reveal onMouseMove={handleGlow}>
            <div className="work-featured__glow" aria-hidden="true" />
            <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto] md:gap-10">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 border border-[#b8933f]/40 bg-[#b8933f]/10 px-2.5 py-1 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#d8b96a]">
                    {featured.badge || "Flagship"}
                  </span>
                  <span className="font-mono-tech text-xs text-[#8f8774]">{featured.year}</span>
                </div>
                <h2 className="mt-5 font-serif-zh text-3xl font-bold tracking-[0.08em] text-[#f3edde] md:text-4xl">
                  {featured.title}
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-loose text-[#c9c0ab] md:text-base">
                  {featured.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {tagList(featured, 4).map((chip) => (
                    <span key={chip} className="border border-white/10 bg-white/5 px-2.5 py-1 font-mono-tech text-[11px] text-[#b8b09c]">
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  {featured.href && (
                    <Link
                      href={featured.href}
                      className="inline-flex items-center gap-2 bg-[#b8933f] px-5 py-2.5 text-sm font-medium text-[#171410] transition-colors hover:bg-[#cfa64f]"
                    >
                      {featured.cta || "进入页面"}
                      <ArrowRight size={14} />
                    </Link>
                  )}
                  {featured.repo && (
                    <a
                      href={featured.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border border-white/20 px-5 py-2.5 text-sm text-[#f3edde] transition-colors hover:border-[#b8933f]/60 hover:text-[#d8b96a]"
                    >
                      <Github size={15} />
                      GitHub
                    </a>
                  )}
                </div>
              </div>
              {featured.icon.startsWith("/") && (
                <img
                  src={featured.icon}
                  alt={`${featured.title} 图标`}
                  loading="lazy"
                  decoding="async"
                  className="work-icon mx-auto w-20 animate-float md:w-32"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===== 作品列表 ===== */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="mb-8" data-reveal>
          <span className="t-eyebrow">All works</span>
          <h2 className="mt-2 font-serif-zh text-2xl font-bold tracking-[0.1em]">全部作品</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {rest.map((work, i) => (
            <WorkCard key={work.id ?? work.title} work={work} delay={i * 60} />
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
