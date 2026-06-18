"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { LogIn, User, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) { setError("请填写用户名和密码"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/");
      } else { setError(data.error || "登录失败"); }
    } catch (error) { setError("登录失败，请重试"); } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-paper">
      <Navigation />
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-md mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="text-center mb-12">
              <span className="text-xs text-stone tracking-widest uppercase mb-2 block">Login</span>
              <h1 className="font-serif-zh text-3xl font-bold tracking-wider mb-4">登录</h1>
              <div className="w-16 h-px bg-ink/10 mx-auto" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="p-4 bg-cinnabar/10 text-cinnabar text-sm rounded">{error}</div>}
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold mb-2"><User size={16} /><span>用户名</span></label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="用户名" className="w-full" required />
              </div>
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold mb-2"><Lock size={16} /><span>密码</span></label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" className="w-full" required />
              </div>
              <button type="submit" disabled={loading} className="btn-ink w-full flex items-center justify-center space-x-2 disabled:opacity-50">
                <LogIn size={16} />
                <span>{loading ? "登录中..." : "登录"}</span>
              </button>
            </form>
            <div className="mt-8 text-center">
              <p className="text-sm text-ink-light">
                还没有账号？ <Link href="/register" className="text-cinnabar hover:underline inline-flex items-center space-x-1"><span>立即注册</span><ArrowRight size={14} /></Link>
              </p>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
