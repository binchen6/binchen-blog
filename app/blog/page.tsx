"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { ArrowRight, Calendar, Eye, Tag } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  created_at: string;
  published_at: string;
  tags: string | null;
  view_count: number;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json() as any)
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-paper">
      <Navigation />

      <section className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-xs text-stone tracking-widest uppercase mb-2 block">
              Articles
            </span>
            <h1 className="font-serif-zh text-4xl md:text-5xl font-bold tracking-wider mb-4">
              文章列表
            </h1>
            <div className="w-16 h-px bg-ink/10 mx-auto" />
          </motion.div>

          {loading ? (
            <div className="ink-loading h-1 max-w-md mx-auto" />
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-stone text-sm">暂无文章</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="paper-card group"
                >
                  <Link href={`/blog/${post.slug}`} className="block">
                    {post.cover_image && (
                      <div className="aspect-video overflow-hidden rounded-t-sm">
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-4 text-xs text-stone">
                        <span className="flex items-center space-x-1">
                          <Calendar size={12} />
                          <span>{formatDate(post.published_at || post.created_at)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Eye size={12} />
                          <span>{post.view_count}</span>
                        </span>
                      </div>
                      <h2 className="font-serif-zh text-xl font-bold tracking-wider mb-3 group-hover:text-ink transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-ink-light leading-relaxed mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      {post.tags && (
                        <div className="flex items-center space-x-2">
                          <Tag size={12} className="text-bronze" />
                          <span className="text-xs text-bronze">{post.tags.split(",").map(t => t.trim()).join(" · ")}</span>
                        </div>
                      )}
                      <div className="mt-4 flex items-center space-x-1 text-xs text-ink-light group-hover:text-ink transition-colors">
                        <span>阅读全文</span>
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
