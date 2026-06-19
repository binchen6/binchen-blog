"use client";

export const runtime = "edge";

import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { ArrowRight, BookOpen, MapPin, Wind, Compass, Cpu, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* 背景层 */}
        <div className="absolute inset-0 paper-texture-bg opacity-80" />
        <div className="absolute inset-0 star-grid-bg opacity-50" />
        
        {/* 水墨晕染装饰 */}
        <div className="absolute top-20 left-10 w-96 h-96 opacity-20">
          <div className="w-full h-full rounded-full bg-gradient-radial from-cyan-dark/30 to-transparent blur-3xl" />
        </div>
        <div className="absolute bottom-20 right-10 w-80 h-80 opacity-20">
          <div className="w-full h-full rounded-full bg-gradient-radial from-bronze/20 to-transparent blur-3xl" />
        </div>
        
        {/* 罗盘装饰 - 右上角 */}
        <motion.div
          className="absolute top-24 right-10 md:right-24 opacity-25"
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        >
          <img src="/compass.svg" alt="" className="w-48 h-48 md:w-64 md:h-64" />
        </motion.div>
        
        {/* 齿轮装饰 - 左下角 */}
        <motion.div
          className="absolute bottom-32 left-10 md:left-20 opacity-20"
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        >
          <img src="/gear.svg" alt="" className="w-32 h-32 md:w-48 md:h-48" />
        </motion.div>

        {/* 主内容 */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* 印章 */}
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

          {/* 主标题 */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="font-serif-zh text-5xl md:text-7xl font-bold tracking-wider mb-6"
          >
            <span className="bronze-text">尘</span>
            <span className="text-ink">墨</span>
          </motion.h1>

          {/* 副标题 - 科技感 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mb-4"
          >
            <p className="font-serif-zh text-xl md:text-2xl text-ink-light tracking-widest mb-2">
              喜欢自由与宁静地生活旅行者
            </p>
            <p className="font-mono-tech text-sm text-cyan-dark tracking-widest uppercase">
              &lt;Traveler · Coder · Dreamer /&gt;
            </p>
          </motion.div>

          {/* 装饰线 */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="w-32 h-px bg-gradient-to-r from-transparent via-bronze to-transparent mx-auto mb-8"
          />

          {/* 描述 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="text-sm text-ink-muted max-w-md mx-auto leading-loose mb-12"
          >
            以笔墨记录旅途风景，以代码构建数字世界。
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
            <Link href="/blog" className="btn-ink flex items-center space-x-2 group">
              <BookOpen size={18} />
              <span>阅读文章</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/guestbook" className="btn-tech flex items-center space-x-2">
              <Sparkles size={18} />
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
          <div className="w-px h-12 bg-gradient-to-b from-cyan-dark/40 to-transparent" />
        </motion.div>
      </section>

      {/* Featured Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 paper-texture-bg opacity-40" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-xs text-ink-muted tracking-widest uppercase mb-2 block font-mono-tech">
              Featured Articles
            </span>
            <h2 className="font-serif-zh text-3xl md:text-4xl font-bold tracking-wider">
              精选文章
            </h2>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-bronze to-transparent mx-auto mt-4" />
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
                <Link href={`/blog/${post.slug}`} className="paper-card block p-6 h-full group">
                  <div className="flex items-center space-x-2 mb-4">
                    <MapPin size={14} className="text-bronze" />
                    <span className="text-xs text-ink-muted font-mono-tech">{post.category}</span>
                  </div>
                  <h3 className="font-serif-zh text-xl font-semibold mb-3 tracking-wide group-hover:text-cyan-dark transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-ink-light leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-ink-muted">
                    <span className="font-mono-tech">{post.date}</span>
                    <span className="flex items-center space-x-1 group-hover:text-cyan-dark transition-colors">
                      <span>阅读更多</span>
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Section - 古代科技展示 */}
      <section className="py-24 px-6 relative ink-gradient-bg">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-xs text-bronze-light/60 tracking-widest uppercase mb-2 block font-mono-tech">
              Ancient Tech
            </span>
            <h2 className="font-serif-zh text-3xl md:text-4xl font-bold tracking-wider text-paper">
              古代科技
            </h2>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-bronze to-transparent mx-auto mt-4" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {techItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-paper/10 backdrop-blur-sm border border-bronze/20 rounded-lg p-6 hover:border-bronze/40 transition-all duration-300 group"
              >
                <div className="text-bronze mb-4 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="font-serif-zh text-xl font-semibold mb-3 tracking-wide text-paper">
                  {item.title}
                </h3>
                <p className="text-sm text-paper/70 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-24 px-6 relative paper-gradient-bg">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-bronze/30 mx-auto mb-6">
              <svg className="w-10 h-10 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>
            <blockquote className="font-serif-zh text-2xl md:text-3xl leading-relaxed tracking-wider text-ink-light mb-6">
              行到水穷处，坐看云起时
            </blockquote>
            <cite className="text-sm text-ink-muted not-italic font-serif-zh">
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

const techItems = [
  {
    id: 1,
    title: "罗盘指南针",
    description: "中国古代四大发明之一，以磁石指南，开启了大航海时代的序幕。",
    icon: <Compass size={32} />,
  },
  {
    id: 2,
    title: "印刷术",
    description: "活字印刷术改变了知识的传播方式，让文明之火得以燎原。",
    icon: <Cpu size={32} />,
  },
  {
    id: 3,
    title: "造纸术",
    description: "蔡伦改进的造纸术，让文字有了载体，让思想得以流传千古。",
    icon: <BookOpen size={32} />,
  },
];
