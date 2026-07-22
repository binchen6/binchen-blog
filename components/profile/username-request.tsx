"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "@/components/toast";
import type { UsernameRequest } from "./types";

interface UsernameRequestFormProps {
  pendingRequest: UsernameRequest | null;
  authHeaders: Record<string, string>;
  onRequested: (request: UsernameRequest) => void;
}

/** 用户名修改申请：有待审申请时锁定输入并展示状态 */
export function UsernameRequestForm({ pendingRequest, authHeaders, onRequested }: UsernameRequestFormProps) {
  const [requestedUsername, setRequestedUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ requestedUsername }),
      });
      const data = (await res.json()) as { request?: UsernameRequest; error?: string };
      if (!res.ok || !data.request) {
        toast(data.error || "提交用户名申请失败", "error");
        return;
      }
      onRequested(data.request);
      setRequestedUsername("");
      toast("用户名修改申请已提交，等待管理员审核");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-cyan-dark/10 bg-paper/55 p-4">
      <label className="mb-2 block text-sm font-semibold text-ink-light">申请修改用户名</label>
      <input value={requestedUsername} onChange={(e) => setRequestedUsername(e.target.value)} className="mb-3 w-full bg-paper/60" placeholder="3-24 位字母、数字、_ 或 -" disabled={!!pendingRequest} />
      {pendingRequest ? (
        <p className="text-sm leading-loose text-ink-muted">已申请修改为 <span className="text-cyan-dark">{pendingRequest.requested_username}</span>，等待管理员审核。</p>
      ) : (
        <button type="submit" disabled={submitting || !requestedUsername.trim()} className="btn-outline inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50">
          <Send size={14} />
          {submitting ? "提交中..." : "提交申请"}
        </button>
      )}
    </form>
  );
}
