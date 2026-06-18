"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { ArrowRight, BookOpen, MapPin, Wind } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 grid-pattern opacity-50" />
        
        {/* Floating compass-like decorative element */}
        <motion.div
          className="absolute top-20 right-10 md:right-20 opacity-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        >
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="95" stroke="#1a1a1a" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="70" stroke="#1a1a1a" strokeWidth="0.3" />
            <circle cx="100" cy="100" r="45" stroke="#1a1a1a" strokeWidth="0.3" />
            <line x1="100" y1="5" x2="100" y2="195" stroke="#1a1a1a" strokeWidth="0.3" />
            <line x1="5" y1="100" x2="195" y2="100" stroke="#1a1a1a" strokeWidth="0.3" />
            <line x1="29" y1="29" x2="171" y2="171" stroke="#1a1a1a" strokeWidth="0.3" />
            <line x1="171" y1="29" x2="29" y2="171" stroke="#1a1a1a" strokeWidth="0.3" />
            {/* Small dots at intersections */}
            <circle cx="100" cy="30" r="2" fill="#8b6914" />
            <circle cx="100" cy="170" r="2" fill="#8b6914" />
            <circle cx="30" cy="100" r="2" fill="#8b6914" />
            <circle cx="170" cy="100" r="2" fill="#8b6914" />
          </svg>
        </motion.div>

        {/* Ink wash decorative circles */}
        <motion.div
          className="absolute bottom-20 left-10 md:left-20 opacity-5"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.05 }}
          transition={{ duration: 3, delay: 1 }}
        >
          <svg width="300" height="300" viewBox="0 0 300 300">
            <defs>
              <radialGradient id="inkWash" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#1a1a1a" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="150" cy="150" r="140" fill="url(#inkWash)" />
          </svg>
        </motion.div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Seal stamp */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: -2 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <span className="seal-stamp text-sm tracking-widest">
              旅行者
            </span>
          </motion.div>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="font-serif-zh text-5xl md:text-7xl font-bold tracking-wider mb-6"
          >
            binchen
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="font-serif-zh text-xl md:text-2xl text-ink-light tracking-widest mb-4"
          >
            喜欢自由与宁静地生活旅行者
          </motion.p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="w-24 h-px bg-ink/20 mx-auto mb-8"
          />

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="text-sm text-stone max-w-md mx-auto leading-loose mb-12"
          >
            以笔墨记录旅途风景，以文字沉淀内心宁静。
            <br />
            在喧嚣世界中寻找一方净土。
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/blog" className="btn-ink flex items-center space-x-2">
              <BookOpen size={18} />
              <span>阅读文章</span>
            </Link>
            <Link href="/guestbook" className="btn-outline flex items-center space-x-2">
              <Wind size={18} />
              <span>留下足迹</span>
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-px h-12 bg-gradient-to-b from-ink/40 to-transparent" />
        </motion.div>
      </section>

      {/* Featured Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-xs text-stone tracking-widest uppercase mb-2 block">
              Featured
            </span>
            <h2 className="font-serif-zh text-3xl md:text-4xl font-bold tracking-wider">
              精选文章
            </h2>
            <div className="w-16 h-px bg-ink/10 mx-auto mt-4" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Link href={`/blog/${post.slug}`} className="paper-card block p-6 h-full">
                  <div className="flex items-center space-x-2 mb-4">
                    <MapPin size={14} className="text-bronze" />
                    <span className="text-xs text-stone">{post.category}</span>
                  </div>
                  <h3 className="font-serif-zh text-xl font-semibold mb-3 tracking-wide">
                    {post.title}
                  </h3>
                  <p className="text-sm text-ink-light leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-stone">
                    <span>{post.date}</span>
                    <span className="flex items-center space-x-1">
                      <span>阅读更多</span>
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-24 px-6 bg-paper-warm">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <svg className="w-8 h-8 text-bronze/30 mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <blockquote className="font-serif-zh text-2xl md:text-3xl leading-relaxed tracking-wider text-ink-light mb-6">
              行到水穷处，坐看云起时
            </blockquote>
            <cite className="text-sm text-stone not-italic">
              — 王维《终南别业》
            </cite>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

const featuredPosts = [
  {
    id: 1,
    slug: "first-journey",
    title: "初次的远行",
    excerpt: "每一次出发都是一次未知的探索，在旅途中我们不仅看到了风景，更看到了自己...",
    category: "旅行随笔",
    date: "2024年春",
  },
  {
    id: 2,
    slug: "mountain-meditation",
    title: "山中静思",
    excerpt: "登高望远，云海翻涌。在山的怀抱中，所有的烦恼都随风而去...",
    category: "生活感悟",
    date: "2024年夏",
  },
  {
    id: 3,
    slug: "ancient-technology",
    title: "古人的智慧",
    excerpt: "从造纸术到印刷术，从罗盘到天文仪器，古代科技中蕴含着深邃的哲学...",
    category: "文化探索",
    date: "2024年秋",
  },
];
