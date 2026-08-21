"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { ArrowRight, BookOpen, Compass, Eye, MessageCircle, Sparkles, Star } from "lucide-react";
import { SiteShell, SurfacePanel } from "@/components/page-chrome";
import { useScrollReveal } from "@/lib/use-reveal";
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

export default function HomePage() {
  const [featuredPosts, setFeaturedPosts] = useState<PostItem[]>([]);
  const [latestPosts, setLatestPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useScrollReveal();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [featuredRes, latestRes] = await Promise.all([
          fetch("/api/posts?featured=1&limit=3"),
          fetch("/api/posts?limit=5"),
        ]);
        const featuredData = (await featuredRes.json()) as { posts?: PostItem[] };
        const latestData = (await latestRes.json()) as { posts?: PostItem[] };
        if (cancelled) return;
        setFeaturedPosts(featuredData.posts || []);
        setLatestPosts(latestData.posts || []);
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

  return (
    <SiteShell>
      {/* ===== Hero 长卷 ===== */}
      <section className="ink-hero">
        <div className="ink-hero__bg" aria-hidden="true" />
        <div className="ink-hero__content mx-auto flex min-h-[88vh] max-w-5xl items-center px-5 pb-24 pt-28">
          <div className="w-full">
            <div className="flex items-start justify-between gap-6">
              <div className="unfold">
                <img src="/assets/ink/seal-logo.png" alt="尘墨印章" className="ink-hero__seal mb-7" />
                <h1 className="font-serif-zh text-5xl font-bold leading-tight tracking-[0.12em] text-ink md:text-7xl">
                  binchen
                </h1>
                <p className="mt-5 max-w-md font-serif-zh text-xl leading-loose tracking-[0.06em] text-ink-2">
                  喜欢自由与宁静地生活，旅行，也记录路上的风景。
                </p>
                <p className="mt-4 max-w-md text-sm leading-loose text-ink-3">
                  山海、日常、古代科技与现代工具——想到就写，写完就放这儿。
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
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

              {/* 竖排题字（桌面显示，移动隐藏） */}
              <div className="v-text hidden shrink-0 select-none text-2xl text-ink-2/80 md:block" aria-hidden="true">
                行到水穷处　坐看云起时
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 作品速览 ===== */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="mb-10 flex items-end justify-between" data-reveal>
          <div>
            <span className="font-mono-tech text-xs uppercase tracking-[0.18em] text-dai/70">Works</span>
            <h2 className="mt-2 font-serif-zh text-3xl font-bold tracking-[0.1em]">造出来的东西</h2>
          </div>
          <Link href="/works" className="group inline-flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-dai">
            全部作品
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          {/* 旗舰：CryClaw */}
          <Link href="/CryClaw" className="work-featured group p-8 md:col-span-3" data-reveal onMouseMove={handleGlow}>
            <div className="work-featured__glow" aria-hidden="true" />
            <div className="relative flex items-center gap-6">
              <div className="flex min-w-0 flex-1 flex-col gap-8">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 border border-[#b8933f]/40 bg-[#b8933f]/10 px-2.5 py-1 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#d8b96a]">
                    <Sparkles size={12} />
                    Flagship
                  </span>
                  <span className="font-mono-tech text-xs text-[#8f8774]">桌面应用 · 2026</span>
                </div>
                <h3 className="mt-5 font-serif-zh text-2xl font-bold tracking-[0.08em] text-[#f3edde] md:text-3xl">
                  CryClaw
                </h3>
                <p className="mt-3 max-w-md text-sm leading-loose text-[#c9c0ab]">
                  高效、易用、纯净的 OpenClaw 桌面客户端——一分钟装好，即刻开聊。
                </p>
              </div>
              <div className="flex items-end justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {["Electron", "487 测试全绿", "≈0.6s 冷启动"].map((chip) => (
                    <span key={chip} className="border border-white/10 bg-white/5 px-2.5 py-1 font-mono-tech text-[11px] text-[#b8b09c]">
                      {chip}
                    </span>
                  ))}
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-[#d8b96a]">
                  进入产品页
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
              </div>
              <img
                src="/CryClaw/assets/icon.png"
                alt="CryClaw 应用图标"
                loading="lazy"
                decoding="async"
                className="work-icon hidden w-20 shrink-0 animate-float sm:block md:w-24"
              />
            </div>
          </Link>

          {/* 地理专题 */}
          <Link
            href="/geography"
            className="work-card group p-6 md:col-span-2"
            data-reveal
            style={{ transitionDelay: "90ms" }}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex h-11 w-11 items-center justify-center border border-dai/30 bg-dai/5 text-dai">
                <Compass size={20} />
              </span>
              <span className="font-mono-tech text-xs text-ink-4">专题 · 2026</span>
            </div>
            <h3 className="mt-5 font-serif-zh text-xl font-semibold tracking-[0.06em] transition-colors group-hover:text-dai">
              地图上的裂痕
            </h3>
            <p className="mt-3 text-sm leading-loose text-ink-3">
              交互式地理长卷：板块、裂谷与时间的刻度，滚动之间徐徐展开。
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-xs text-dai">
              进入专题
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>

        <div
          className="mt-6 flex flex-col gap-2 border border-dashed border-ink-5/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          data-reveal
          style={{ transitionDelay: "160ms" }}
        >
          <p className="text-sm text-ink-3">还有桌面小工具、一部视觉小说，以及这个小站本身。</p>
          <Link href="/works" className="group inline-flex shrink-0 items-center gap-1.5 text-sm text-dai">
            逛逛作品架
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ===== 最新文章·时间轴 ===== */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="mb-10 flex items-end justify-between" data-reveal>
          <div>
            <span className="font-mono-tech text-xs uppercase tracking-[0.18em] text-dai/70">Latest</span>
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

      <img src="/assets/ink/brush-divider-1.jpg" alt="" aria-hidden="true" className="brush-divider" />

      {/* ===== 精选 ===== */}
      {(loading || featuredPosts.length > 0) && (
        <section className="mx-auto max-w-5xl px-5 py-16">
          <div className="mb-10" data-reveal>
            <span className="font-mono-tech text-xs uppercase tracking-[0.18em] text-dai/70">Featured</span>
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
            <SurfacePanel key={item.title} className="unfold p-6" >
              <div className="font-serif-zh text-3xl font-bold text-gold">{item.title}</div>
              <p className="mt-4 text-sm leading-loose text-ink-2">{item.description}</p>
            </SurfacePanel>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
