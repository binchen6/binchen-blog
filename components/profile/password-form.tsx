"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "@/components/toast";
import type { PasswordFormState } from "./types";

interface PasswordFormProps {
  authHeaders: Record<string, string>;
}

/** 修改密码表单：前端校验两次输入一致后提交 */
export function PasswordForm({ authHeaders }: PasswordFormProps) {
  const [form, setForm] = useState<PasswordFormState>({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast("两次输入的新密码不一致", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        toast(data.error || "修改密码失败", "error");
        return;
      }
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast("密码已更新，下次登录请使用新密码");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-cyan-dark/10 bg-paper/55 p-4">
      <label className="mb-3 block text-sm font-semibold text-ink-light">修改密码</label>
      <div className="space-y-3">
        <input
          type="password"
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          className="w-full bg-paper/60"
          placeholder="当前密码"
          required
        />
        <input
          type="password"
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          className="w-full bg-paper/60"
          placeholder="新密码（8-128 位）"
          minLength={8}
          required
        />
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          className="w-full bg-paper/60"
          placeholder="确认新密码"
          minLength={8}
          required
        />
        <button type="submit" disabled={submitting} className="btn-outline inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50">
          <Lock size={14} />
          {submitting ? "提交中..." : "更新密码"}
        </button>
      </div>
    </form>
  );
}
