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
      .then((res) => res.json() as any)
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
      const data = await res.json() as any;
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
              <span>写下你的留言</span>
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="姓名" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full" required />
                <input type="email" placeholder="邮箱" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full" required />
              </div>
              <textarea placeholder="写下你的想法..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full h-32 resize-none" required />
              <button type="submit" disabled={submitting} className="btn-ink flex items-center space-x-2 disabled:opacity-50">
                <Send size={16} />
                <span>{submitting ? "提交中..." : "提交留言"}</span>
              </button>
            </form>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }} className="space-y-6">
            {loading ? (
              <div className="ink-loading h-1 max-w-md mx-auto" />
            ) : entries.length === 0 ? (
              <p className="text-stone text-center py-8">暂无留言，来做第一个留言者吧！</p>
            ) : (
              entries.map((entry) => (
                <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="paper-card p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center">
                      <User size={16} className="text-ink-light" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold">{entry.name}</span>
                      <span className="text-xs text-stone ml-2">{formatDate(entry.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-ink-light leading-relaxed">{entry.content}</p>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
