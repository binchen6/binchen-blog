"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CSSProperties, MouseEvent } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, Eye, MessageCircle, Sparkles, Star } from "lucide-react";
import { SiteShell, SurfacePanel } from "@/components/page-chrome";
import { useScrollReveal } from "@/lib/use-reveal";
import { DEFAULT_WORKS, WORK_ACCENTS, WORK_ICONS } from "@/lib/works-defaults";
import type { WorkItem } from "@/lib/works-defaults";
import { formatDate } from "@/lib/utils";

interface PostItem {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  tags: string | null;
  mode: "article" | "moment";
  published_at: string | null;
  created_at: string;
  view_count?: number;
  like_count?: number;
}

const principles = [
  {
    title: "藏",
    description: "少装饰，多留白。内容是主角，界面退后一步。",
  },
  {
    title: "叙",
    description: "文章按时间铺开，像一幅长卷，从最近往回翻。",
  },
  {
    title: "双",
    description: "鼠标和手指是两种生物。桌面有桌面的玩法，手机有手机的。",
  },
];

/** 鼠标跟随光斑：只写 CSS 变量，不触发 layout */
function handleGlow(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  el.style.setProperty("--my", `${e.clientY - rect.top}px`);
}

function tagList(work: WorkItem, max = 3): string[] {
  return work.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, max);
}

export default function HomePage() {
  const [featuredPosts, setFeaturedPosts] = useState<PostItem[]>([]);
  const [latestPosts, setLatestPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [works, setWorks] = useState<WorkItem[]>(DEFAULT_WORKS);

  useScrollReveal([loading, works.length]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [featuredRes, latestRes, worksRes] = await Promise.all([
          fetch("/api/posts?featured=1&limit=3"),
          fetch("/api/posts?limit=5"),
          fetch("/api/works"),
        ]);
        const featuredData = (await featuredRes.json()) as { posts?: PostItem[] };
        const latestData = (await latestRes.json()) as { posts?: PostItem[] };
        const worksData = (await worksRes.json()) as { works?: WorkItem[] };
        if (cancelled) return;
        setFeaturedPosts(featuredData.posts || []);
        setLatestPosts(latestData.posts || []);
        if (worksData.works && worksData.works.length > 0) setWorks(worksData.works);
      } catch {
        if (!cancelled) {
          setFeaturedPosts([]);
          setLatestPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredWork = works.find((w) => w.featured === 1) ?? works[0];
  const sideWork = works.find((w) => w !== featuredWork);
  const SideIcon = sideWork ? (WORK_ICONS[sideWork.icon] ?? WORK_ICONS.sparkles) : WORK_ICONS.sparkles;
  const sideAccent = sideWork ? (WORK_ACCENTS[sideWork.accent] ?? WORK_ACCENTS.dai) : WORK_ACCENTS.dai;

  return (
    <SiteShell>
      {/* ===== Hero · 极简排版 ===== */}
      <section className="hero-min">
        <img src="/assets/ink/seal-logo.webp" alt="" aria-hidden="true" className="hero-min__seal" />
        <div className="mx-auto max-w-5xl px-5 pb-20 pt-36 md:pb-28 md:pt-44">
          <span className="t-eyebrow anim-fade">尘墨 · binchen&apos;s blog</span>
          <h1 className="anim-fade mt-6 font-serif-zh text-6xl font-bold tracking-[0.1em] text-ink md:text-8xl" style={{ "--d": ".08s" } as CSSProperties}>
            binchen
          </h1>
          <div className="hero-min__rule" aria-hidden="true" />
          <p className="anim-fade max-w-xl font-serif-zh text-xl leading-loose tracking-[0.06em] text-ink-2" style={{ "--d": ".2s" } as CSSProperties}>
            喜欢自由与宁静地生活，旅行，也记录路上的风景。
          </p>
          <p className="anim-fade mt-4 max-w-md text-sm leading-loose text-ink-3" style={{ "--d": ".28s" } as CSSProperties}>
            山海、日常、古代科技与现代工具——想到就写，写完就放这儿。
          </p>
          <div className="anim-fade mt-10 flex flex-col gap-3 sm:flex-row" style={{ "--d": ".38s" } as CSSProperties}>
            <Link href="/works" className="btn-ink inline-flex items-center justify-center gap-2">
              <Sparkles size={17} />
              <span>看看作品</span>
              <ArrowRight size={14} />
            </Link>
            <Link href="/blog" className="btn-tech inline-flex items-center justify-center gap-2">
              <BookOpen size={17} />
              <span>展开长卷</span>
            </Link>
            <Link href="/guestbook" className="btn-outline inline-flex items-center justify-center gap-2">
              <MessageCircle size={17} />
              <span>留个言</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 作品速览 ===== */}
      {featuredWork && (
        <section className="mx-auto max-w-5xl px-5 py-16 md:py-20">
          <div className="mb-10 flex items-end justify-between" data-reveal>
            <div>
              <span className="t-eyebrow">Works</span>
              <h2 className="mt-2 font-serif-zh text-3xl font-bold tracking-[0.1em]">造出来的东西</h2>
            </div>
            <Link href="/works" className="group inline-flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-dai">
              全部作品
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-5">
            {/* 旗舰 */}
            <Link href={featuredWork.href || "/works"} className="work-featured group p-8 md:col-span-3" data-reveal onMouseMove={handleGlow}>
              <div className="work-featured__glow" aria-hidden="true" />
              <div className="relative flex items-center gap-6">
                <div className="flex min-w-0 flex-1 flex-col gap-8">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 border border-[#b8933f]/40 bg-[#b8933f]/10 px-2.5 py-1 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#d8b96a]">
                        <Sparkles size={12} />
                        {featuredWork.badge || "Flagship"}
                      </span>
                      <span className="font-mono-tech text-xs text-[#8f8774]">{featuredWork.year}</span>
                    </div>
                    <h3 className="mt-5 font-serif-zh text-2xl font-bold tracking-[0.08em] text-[#f3edde] md:text-3xl">
                      {featuredWork.title}
                    </h3>
                    <p className="mt-3 line-clamp-2 max-w-md text-sm leading-loose text-[#c9c0ab]">
                      {featuredWork.description}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {tagList(featuredWork).map((chip) => (
                        <span key={chip} className="border border-white/10 bg-white/5 px-2.5 py-1 font-mono-tech text-[11px] text-[#b8b09c]">
                          {chip}
                        </span>
                      ))}
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-[#d8b96a]">
                      {featuredWork.cta || "进入页面"}
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
                {featuredWork.icon.startsWith("/") && (
                  <img
                    src={featuredWork.icon}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="work-icon hidden w-20 shrink-0 animate-float sm:block md:w-24"
                  />
                )}
              </div>
            </Link>

            {/* 次位作品 */}
            {sideWork && (
              <Link
                href={sideWork.href || "/works"}
                className="work-card group p-6 md:col-span-2"
                data-reveal
                style={{ transitionDelay: "90ms" }}
                {...(sideWork.external === 1 ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex h-11 w-11 items-center justify-center border ${sideAccent}`}>
                    <SideIcon size={20} />
                  </span>
                  <span className="font-mono-tech text-xs text-ink-4">
                    {sideWork.badge}{sideWork.year ? ` · ${sideWork.year}` : ""}
                  </span>
                </div>
                <h3 className="mt-5 font-serif-zh text-xl font-semibold tracking-[0.06em] transition-colors group-hover:text-dai">
                  {sideWork.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-loose text-ink-3">{sideWork.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-xs text-dai">
                  {sideWork.cta || "去看看"}
                  {sideWork.external === 1 ? (
                    <ArrowUpRight size={13} />
                  ) : (
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  )}
                </span>
              </Link>
            )}
          </div>

          <div
            className="mt-8 flex flex-col gap-2 border border-dashed border-ink-5/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            data-reveal
            style={{ transitionDelay: "160ms" }}
          >
            <p className="text-sm text-ink-3">作品架共 {works.length} 件——工具、专题、小站，持续增加。</p>
            <Link href="/works" className="group inline-flex shrink-0 items-center gap-1.5 text-sm text-dai">
              逛逛作品架
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      )}

      {/* ===== 最新文章·时间轴 ===== */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="mb-10 flex items-end justify-between" data-reveal>
          <div>
            <span className="t-eyebrow">Latest</span>
            <h2 className="mt-2 font-serif-zh text-3xl font-bold tracking-[0.1em]">最近写的</h2>
          </div>
          <Link href="/blog" className="group inline-flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-dai">
            全部文章
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-20 w-full" />
            ))}
          </div>
        ) : latestPosts.length === 0 ? (
          <p className="text-sm text-ink-3">还没有发布内容。第一篇正在路上。</p>
        ) : (
          <div className="ink-timeline">
            {latestPosts.map((post, index) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="ink-timeline__item unfold group"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className="ink-timeline__date">
                  <div className="font-mono-tech text-xs text-ink-4">
                    {formatDate(post.published_at || post.created_at)}
                  </div>
                  {post.mode === "moment" && (
                    <div className="mt-1 text-[10px] text-gold">动态</div>
                  )}
                </div>
                <div className="min-w-0 flex-1 border-b border-ink-5/70 pb-5">
                  <h3 className="font-serif-zh text-lg font-semibold tracking-[0.05em] transition-colors group-hover:text-dai">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-3">{post.excerpt}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4 font-mono-tech text-xs text-ink-4">
                    <span className="inline-flex items-center gap-1">
                      <Eye size={11} />
                      {post.view_count ?? 0}
                    </span>
                    {post.tags && (
                      <span className="text-gold/80">
                        {post.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 2).join(" · ")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="section-rule" aria-hidden="true" />

      {/* ===== 精选 ===== */}
      {(loading || featuredPosts.length > 0) && (
        <section className="mx-auto max-w-5xl px-5 py-16">
          <div className="mb-10" data-reveal>
            <span className="t-eyebrow">Featured</span>
            <h2 className="mt-2 font-serif-zh text-3xl font-bold tracking-[0.1em]">值得一读再读</h2>
          </div>
          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-52 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {featuredPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="paper-card group block h-full p-6">
                  <div className="mb-4 flex items-center gap-2 text-xs text-ink-4">
                    <Star size={13} className="text-gold" />
                    <span className="font-mono-tech">{formatDate(post.published_at || post.created_at)}</span>
                  </div>
                  <h3 className="font-serif-zh text-xl font-semibold tracking-[0.06em] transition-colors group-hover:text-dai">
                    {post.title}
                  </h3>
                  <p className="mt-4 line-clamp-3 text-sm leading-loose text-ink-2">{post.excerpt || "打开读全文。"}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-xs text-dai">
                    读这篇
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ===== 三条理念 ===== */}
      <section className="mx-auto max-w-5xl px-5 pb-24 pt-8">
        <div className="grid gap-6 md:grid-cols-3">
          {principles.map((item, index) => (
            <SurfacePanel key={item.title} className="p-6" data-reveal style={{ transitionDelay: `${index * 80}ms` }}>
              <div className="font-serif-zh text-3xl font-bold text-gold">{item.title}</div>
              <p className="mt-4 text-sm leading-loose text-ink-2">{item.description}</p>
            </SurfacePanel>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
