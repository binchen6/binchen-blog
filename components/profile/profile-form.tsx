"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "@/components/toast";
import { storeAuth } from "@/lib/client-auth";
import type { ProfileFormState, ProfileUser } from "./types";

interface ProfileFormProps {
  form: ProfileFormState;
  onChange: (form: ProfileFormState) => void;
  authHeaders: Record<string, string>;
  token: string;
  onSaved: (user: ProfileUser) => void;
}

/** 个人资料表单：显示名称 / 邮箱 / 简介 */
export function ProfileForm({ form, onChange, authHeaders, token, onSaved }: ProfileFormProps) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { user?: ProfileUser; error?: string };
      if (!res.ok || !data.user) {
        toast(data.error || "保存资料失败", "error");
        return;
      }
      storeAuth(data.user, token);
      onSaved(data.user);
      toast("个人资料已保存");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <input value={form.displayName} onChange={(e) => onChange({ ...form, displayName: e.target.value })} className="w-full bg-paper/60" placeholder="显示名称" />
      <input type="email" value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} className="w-full bg-paper/60" required />
      <textarea value={form.bio} onChange={(e) => onChange({ ...form, bio: e.target.value })} className="h-28 w-full resize-none bg-paper/60 md:col-span-2" maxLength={240} placeholder="个人简介" />
      <button type="submit" disabled={saving} className="btn-tech inline-flex items-center gap-2 disabled:opacity-50">
        <Save size={16} />
        {saving ? "保存中..." : "保存个人资料"}
      </button>
    </form>
  );
}
