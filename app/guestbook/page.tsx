"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Send, MessageCircle, User, Wind, BookOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface GuestbookEntry {
  id: number;
  name: string;
  email: string;
  content: string;
  created_at: string;
  reply_to: number | null;
}

export default function GuestbookPage() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", content: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/guestbook")
      .then((res) => res.json())
      .then((data) => { setEntries(data.entries || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.content) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.entry) { setEntries([data.entry, ...entries]); setForm({ name: "", email: "", content: "" }); }
    } catch (error) { console.error("Submit error:", error); } finally { setSubmitting(false); }
  };

  return (
    <main className="min-h-screen bg-paper">
      <Navigation />
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <span className="text-xs text-stone tracking-widest uppercase mb-2 block">Guestbook</span>
            <h1 className="font-serif-zh text-4xl md:text-5xl font-bold tracking-wider mb-4">留言板</h1>
            <p className="text-sm text-ink-light max-w-md mx-auto leading-relaxed">欢迎在此留下你的足迹，无论是问候、建议还是分享，我都期待与你的交流。</p>
            <div className="w-16 h-px bg-ink/10 mx-auto mt-4" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="paper-card p-8 mb-12">
            <h2 className="font-serif-zh text-xl font-semibold mb-6 flex items-center space-x-2">
              <Wind size={20} />
              <span>写下留言</span>
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="姓名 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full" required />
                <input type="email" placeholder="邮箱 *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full" required />
              </div>
              <textarea placeholder="想说的话..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full h-32 resize-none" required />
              <button type="submit" disabled={submitting} className="btn-ink flex items-center space-x-2 disabled:opacity-50">
                <Send size={16} />
                <span>{submitting ? "提交中..." : "提交留言"}</span>
              </button>
            </form>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}>
            <h2 className="font-serif-zh text-xl font-semibold mb-8 flex items-center space-x-2">
              <MessageCircle size={20} />
              <span>所有留言 ({entries.length})</span>
            </h2>
            {loading ? (
              <div className="ink-loading h-1 max-w-md mx-auto" />
            ) : entries.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="mx-auto text-stone/30 mb-4" size={48} />
                <p className="text-stone">暂无留言，来做第一个留言者吧！</p>
              </div>
            ) : (
              <div className="space-y-6">
                {entries.map((entry, index) => (
                  <motion.div key={entry.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} className="paper-card p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-full bg-ink/10 flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-ink-light" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">{entry.name}</span>
                          <span className="text-xs text-stone">{formatDate(entry.created_at)}</span>
                        </div>
                        <p className="text-sm text-ink-light leading-relaxed">{entry.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
