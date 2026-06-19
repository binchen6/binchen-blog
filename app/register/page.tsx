"use client";

export const runtime = "edge";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { UserPlus, User, Lock, Mail, ArrowRight } from "lucide-react";
import { validateEmail } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !email || !password) { setError("请填写所有必填字段"); return; }
    if (!validateEmail(email)) { setError("请输入有效的邮箱地址"); return; }
    if (password.length < 6) { setError("密码至少 6 位"); return; }
    if (password !== confirmPassword) { setError("两次输入的密码不一致"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, displayName: displayName || undefined }),
      });
      const data = await res.json() as any;
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/");
      } else { setError(data.error || "注册失败"); }
    } catch (error) { setError("注册失败，请重试"); } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-paper">
      <Navigation />
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-md mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="text-center mb-12">
              <span className="text-xs text-stone tracking-widest uppercase mb-2 block">Register</span>
              <h1 className="font-serif-zh text-3xl font-bold tracking-wider mb-4">注册</h1>
              <div className="w-16 h-px bg-ink/10 mx-auto" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="p-4 bg-cinnabar/10 text-cinnabar text-sm rounded">{error}</div>}
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold mb-2"><User size={16} /><span>用户名 *</span></label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="用户名" className="w-full" required />
              </div>
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold mb-2"><Mail size={16} /><span>邮箱 *</span></label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱" className="w-full" required />
              </div>
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold mb-2"><User size={16} /><span>显示名称</span></label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="显示名称（可选）" className="w-full" />
              </div>
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold mb-2"><Lock size={16} /><span>密码 *</span></label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码（至少6位）" className="w-full" required />
              </div>
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold mb-2"><Lock size={16} /><span>确认密码 *</span></label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="再次输入密码" className="w-full" required />
              </div>
              <button type="submit" disabled={loading} className="btn-ink w-full flex items-center justify-center space-x-2 disabled:opacity-50">
                <UserPlus size={16} />
                <span>{loading ? "注册中..." : "注册"}</span>
              </button>
              <p className="text-center text-sm text-stone">
                已有账号？<Link href="/login" className="text-ink hover:underline">立即登录</Link>
              </p>
            </form>
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
