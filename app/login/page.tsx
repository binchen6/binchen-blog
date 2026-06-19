"use client";

export const runtime = "edge";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { LogIn, User, Lock, ArrowRight, Compass } from "lucide-react";

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
      const data = await res.json() as any;
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/");
      } else { setError(data.error || "登录失败"); }
    } catch (error) { setError("登录失败，请重试"); } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <Navigation />
      
      {/* 背景 */}
      <div className="absolute inset-0 paper-texture-bg opacity-80 pointer-events-none" />
      <div className="absolute inset-0 star-grid-bg opacity-40 pointer-events-none" />
      
      {/* 装饰罗盘 */}
      <motion.div
        className="absolute top-32 right-10 md:right-20 opacity-20 pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
      >
        <img src="/compass.svg" alt="" className="w-40 h-40 md:w-56 md:h-56" />
      </motion.div>
      
      {/* 装饰齿轮 */}
      <motion.div
        className="absolute bottom-40 left-10 md:left-16 opacity-15 pointer-events-none"
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        <img src="/gear.svg" alt="" className="w-28 h-28 md:w-40 md:h-40" />
      </motion.div>

      <section className="pt-24 pb-16 px-6 relative z-10">
        <div className="max-w-md mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* 登录卡片 */}
            <div className="bg-paper/80 backdrop-blur-sm border border-cyan-dark/10 rounded-lg p-8 shadow-xl relative overflow-hidden">
              {/* 顶部装饰线 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-bronze to-transparent" />
              
              <div className="text-center mb-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mb-4"
                >
                  <Compass size={40} className="text-bronze mx-auto" />
                </motion.div>
                <span className="text-xs text-ink-muted tracking-widest uppercase mb-2 block font-mono-tech">
                  Login
                </span>
                <h1 className="font-serif-zh text-3xl font-bold tracking-wider mb-4">
                  登录
                </h1>
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-bronze to-transparent mx-auto" />
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-cinnabar/10 border border-cinnabar/20 text-cinnabar text-sm rounded">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold mb-2 text-ink-light">
                    <User size={16} className="text-bronze" />
                    <span>用户名</span>
                  </label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="请输入用户名" 
                    className="w-full bg-paper/50 border-mist focus:border-cyan-dark focus:shadow-tech-glow-sm transition-all" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold mb-2 text-ink-light">
                    <Lock size={16} className="text-bronze" />
                    <span>密码</span>
                  </label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="请输入密码" 
                    className="w-full bg-paper/50 border-mist focus:border-cyan-dark focus:shadow-tech-glow-sm transition-all" 
                    required 
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn-tech w-full flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <LogIn size={16} />
                  <span>{loading ? "登录中..." : "登录"}</span>
                  <ArrowRight size={14} />
                </button>
                
                <p className="text-center text-sm text-ink-muted">
                  还没有账号？<Link href="/register" className="text-cyan-dark hover:text-bronze transition-colors">立即注册</Link>
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
