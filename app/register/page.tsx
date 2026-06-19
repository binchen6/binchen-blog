"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, Sparkles, User, UserPlus } from "lucide-react";
import { SiteShell, SurfacePanel } from "@/components/page-chrome";
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
    if (!username || !email || !password) {
      setError("请填写所有必填字段");
      return;
    }
    if (!validateEmail(email)) {
      setError("请输入有效的邮箱地址");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, displayName: displayName || undefined }),
      });
      const data = (await res.json()) as { token?: string; user?: unknown; error?: string };
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/");
      } else {
        setError(data.error || "注册失败");
      }
    } catch {
      setError("注册失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell compactDecor>
      <section className="mx-auto max-w-md px-6 pb-20 pt-28">
        <SurfacePanel as="form" onSubmit={handleSubmit} className="space-y-5 p-7 md:p-8">
          <div className="text-center">
            <Sparkles size={40} className="mx-auto mb-4 text-bronze" />
            <span className="mb-2 block font-mono-tech text-xs uppercase tracking-[0.18em] text-cyan-dark/70">Register</span>
            <h1 className="font-serif-zh text-3xl font-bold tracking-[0.12em]">注册</h1>
            <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-bronze to-transparent" />
          </div>

          {error && <div className="border border-cinnabar/20 bg-cinnabar/10 p-4 text-sm text-cinnabar">{error}</div>}

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-light">
              <User size={16} className="text-bronze" />
              用户名 *
            </label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="用于登录" className="w-full bg-paper/60" required />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-light">
              <Mail size={16} className="text-bronze" />
              邮箱 *
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full bg-paper/60" required />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-light">
              <UserPlus size={16} className="text-bronze" />
              显示名称
            </label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="可选" className="w-full bg-paper/60" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-light">
                <Lock size={16} className="text-bronze" />
                密码 *
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 6 位" className="w-full bg-paper/60" required />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-light">
                <Lock size={16} className="text-bronze" />
                确认 *
              </label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="再次输入密码" className="w-full bg-paper/60" required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-tech flex w-full items-center justify-center gap-2 disabled:opacity-50">
            <UserPlus size={16} />
            <span>{loading ? "注册中..." : "创建账号"}</span>
            <ArrowRight size={14} />
          </button>

          <p className="text-center text-sm text-ink-muted">
            已有账号？
            <Link href="/login" className="text-cyan-dark transition-colors hover:text-bronze">
              去登录
            </Link>
          </p>
        </SurfacePanel>
      </section>
    </SiteShell>
  );
}
