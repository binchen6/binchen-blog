"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Cpu, Feather, MapPin, MessageCircle, Sparkles } from "lucide-react";
import { PageHeader, SiteShell, SurfacePanel } from "@/components/page-chrome";

const featuredPosts = [
  {
    id: 1,
    slug: "first-journey",
    title: "初次的远行",
    excerpt: "每一次出发都是一次未知的探索，在旅途中看见风景，也重新看见自己。",
    category: "旅行随笔",
    date: "2024 春",
  },
  {
    id: 2,
    slug: "mountain-meditation",
    title: "山中静思",
    excerpt: "登高望远，云海翻涌。安静不是远离世界，而是重新整理与世界的关系。",
    category: "生活感悟",
    date: "2024 夏",
  },
  {
    id: 3,
    slug: "ancient-technology",
    title: "古人的智慧",
    excerpt: "从罗盘到天文仪器，古代科技里藏着秩序、好奇心与朴素的精确。",
    category: "文化探索",
    date: "2024 秋",
  },
];

const principles = [
  {
    icon: <Compass size={28} />,
    title: "自由地抵达",
    description: "把旅行当作观察世界的方式，也当作重新校准自己的仪器。",
  },
  {
    icon: <Feather size={28} />,
    title: "宁静地书写",
    description: "用更少的噪声承载更多细节，让文字和图片自然呼吸。",
  },
  {
    icon: <Cpu size={28} />,
    title: "轻量地运行",
    description: "页面共享背景与组件结构，动画克制，资源可缓存，适合 Cloudflare Pages。",
  },
];

export default function HomePage() {
  return (
    <SiteShell>
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-6 pb-20 pt-28 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="reveal-up">
          <span className="seal-stamp mb-7">旅行者</span>
          <h1 className="font-serif-zh text-5xl font-bold leading-tight tracking-[0.14em] text-ink md:text-7xl">
            <span className="bronze-text">binchen</span>
            <span className="mt-3 block text-3xl text-ink md:text-5xl">自由与宁静</span>
          </h1>
          <p className="mt-7 max-w-xl font-serif-zh text-xl leading-loose tracking-[0.08em] text-ink-light">
            喜欢自由与宁静地生活旅行者
          </p>
          <p className="mt-5 max-w-xl text-sm leading-loose text-ink-muted md:text-base">
            这里记录路上的山海、日常里的片刻安宁，以及我对古代科技与现代工具的兴趣。图文可以在线撰写上传，留言也会安静地留下来。
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/blog" className="btn-ink inline-flex items-center justify-center gap-2">
              <BookOpen size={18} />
              <span>阅读文章</span>
              <ArrowRight size={15} />
            </Link>
            <Link href="/guestbook" className="btn-tech inline-flex items-center justify-center gap-2">
              <MessageCircle size={18} />
              <span>留下足迹</span>
            </Link>
          </div>
        </div>

        <div className="reveal-soft relative">
          <div className="hero-mark">
            <Compass size={72} className="text-bronze" />
          </div>
          <SurfacePanel className="mt-8 p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono-tech text-xs uppercase tracking-[0.18em] text-cyan-dark/70">profile</p>
                <h2 className="mt-2 font-serif-zh text-2xl font-semibold tracking-[0.1em]">尘墨手记</h2>
              </div>
              <Sparkles size={24} className="text-bronze" />
            </div>
            <div className="space-y-4 text-sm leading-loose text-ink-light">
              <p>以宣纸为底，以星图为序，用技术托住日常表达。</p>
              <p>少一点喧哗，多一点留白，让博客像一本可以继续翻开的旅行册。</p>
            </div>
          </SurfacePanel>
        </div>
      </section>

      <section className="quiet-band px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <PageHeader eyebrow="Featured Articles" title="精选文章" description="从旅行、生活到古代科技，挑几篇先放在案头。" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {featuredPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="paper-card group block h-full p-6">
                <div className="mb-4 flex items-center gap-2 text-xs text-ink-muted">
                  <MapPin size={14} className="text-bronze" />
                  <span className="font-mono-tech">{post.category}</span>
                  <span className="ml-auto font-mono-tech">{post.date}</span>
                </div>
                <h3 className="font-serif-zh text-xl font-semibold tracking-[0.08em] transition-colors group-hover:text-cyan-dark">
                  {post.title}
                </h3>
                <p className="mt-4 text-sm leading-loose text-ink-light">{post.excerpt}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-xs text-cyan-dark">
                  阅读更多
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <PageHeader eyebrow="Design Logic" title="古风科技的秩序" description="不把风格做成表演，而是让纹理、留白、数据感与内容一起工作。" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {principles.map((item) => (
              <SurfacePanel key={item.title} className="p-6">
                <div className="mb-5 text-bronze">{item.icon}</div>
                <h3 className="font-serif-zh text-xl font-semibold tracking-[0.08em]">{item.title}</h3>
                <p className="mt-4 text-sm leading-loose text-ink-light">{item.description}</p>
              </SurfacePanel>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
