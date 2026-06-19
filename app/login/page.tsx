"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, Lock, LogIn, User } from "lucide-react";
import { SiteShell, SurfacePanel } from "@/components/page-chrome";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("请填写用户名和密码");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { token?: string; user?: unknown; error?: string };
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/");
      } else {
        setError(data.error || "登录失败");
      }
    } catch {
      setError("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell compactDecor>
      <section className="mx-auto max-w-md px-6 pb-20 pt-28">
        <SurfacePanel as="form" onSubmit={handleSubmit} className="space-y-6 p-7 md:p-8">
          <div className="text-center">
            <Compass size={40} className="mx-auto mb-4 text-bronze" />
            <span className="mb-2 block font-mono-tech text-xs uppercase tracking-[0.18em] text-cyan-dark/70">Login</span>
            <h1 className="font-serif-zh text-3xl font-bold tracking-[0.12em]">登录</h1>
            <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-bronze to-transparent" />
          </div>

          {error && <div className="border border-cinnabar/20 bg-cinnabar/10 p-4 text-sm text-cinnabar">{error}</div>}

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-light">
              <User size={16} className="text-bronze" />
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className="w-full bg-paper/60"
              required
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-light">
              <Lock size={16} className="text-bronze" />
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full bg-paper/60"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-tech flex w-full items-center justify-center gap-2 disabled:opacity-50">
            <LogIn size={16} />
            <span>{loading ? "登录中..." : "登录"}</span>
            <ArrowRight size={14} />
          </button>

          <p className="text-center text-sm text-ink-muted">
            还没有账号？
            <Link href="/register" className="text-cyan-dark transition-colors hover:text-bronze">
              立即注册
            </Link>
          </p>
        </SurfacePanel>
      </section>
    </SiteShell>
  );
}
