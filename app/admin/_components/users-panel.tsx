"use client";

import { UserCog } from "lucide-react";
import { SurfacePanel } from "@/components/page-chrome";
import { toast } from "@/components/toast";
import { formatDate } from "@/lib/utils";
import type { UserRow, UsernameRequestRow } from "./types";

const roleLabels: Record<string, string> = {
  owner: "站主",
  admin: "管理员",
  editor: "编辑",
  author: "作者",
  member: "成员",
};

export function UsersPanel({
  users,
  setUsers,
  usernameRequests,
  setUsernameRequests,
  authHeaders,
  onUsersChanged,
}: {
  users: UserRow[];
  setUsers: React.Dispatch<React.SetStateAction<UserRow[]>>;
  usernameRequests: UsernameRequestRow[];
  setUsernameRequests: React.Dispatch<React.SetStateAction<UsernameRequestRow[]>>;
  authHeaders: Record<string, string>;
  onUsersChanged: () => void;
}) {
  const updateUser = async (user: UserRow, patch: { role?: string; isActive?: boolean }) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(patch),
      });
      const data = await res.json() as { user?: UserRow; error?: string };
      if (!res.ok || !data.user) {
        toast(data.error || "更新用户失败", "error");
        return;
      }
      setUsers((current) => current.map((item) => item.id === user.id ? data.user! : item));
    } catch {
      toast("网络异常，更新用户失败", "error");
    }
  };

  const reviewUsernameRequest = async (id: number, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/admin/username-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        toast(data.error || "处理用户名申请失败", "error");
        return;
      }
      setUsernameRequests((current) => current.filter((item) => item.id !== id));
      if (action === "approve") onUsersChanged();
    } catch {
      toast("网络异常，处理用户名申请失败", "error");
    }
  };

  return (
    <SurfacePanel className="p-6">
      <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
        <UserCog size={20} className="text-bronze" />
        用户与用户组
      </h2>
      {usernameRequests.length > 0 && (
        <div className="mb-6 space-y-3 border-b border-cyan-dark/10 pb-6">
          <div className="text-sm font-semibold text-ink-light">待审核用户名申请</div>
          {usernameRequests.map((request) => (
            <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 border border-bronze/20 bg-paper/60 p-4">
              <div>
                <div className="font-semibold">{request.display_name || request.current_username}</div>
                <div className="mt-1 text-sm text-ink-muted">
                  @{request.current_username} → <span className="text-cyan-dark">@{request.requested_username}</span>
                </div>
                <div className="mt-1 font-mono-tech text-xs text-ink-muted">{formatDate(request.created_at)}</div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => reviewUsernameRequest(request.id, "approve")} className="btn-tech px-4 py-2 text-xs">
                  同意
                </button>
                <button type="button" onClick={() => reviewUsernameRequest(request.id, "reject")} className="btn-outline px-4 py-2 text-xs">
                  拒绝
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-cyan-dark/10 text-ink-muted">
            <tr>
              <th className="py-3">用户</th>
              <th>邮箱</th>
              <th>用户组</th>
              <th>状态</th>
              <th>注册时间</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-cyan-dark/5">
                <td className="py-3 font-semibold">{user.display_name || user.username}</td>
                <td>{user.email}</td>
                <td>
                  <select value={user.role} onChange={(e) => updateUser(user, { role: e.target.value })} className="bg-paper/70">
                    {Object.keys(roleLabels).map((role) => (
                      <option key={role} value={role}>{roleLabels[role]}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button type="button" onClick={() => updateUser(user, { isActive: user.is_active !== 1 })} className={user.is_active === 1 ? "text-cyan-dark" : "text-cinnabar"}>
                    {user.is_active === 1 ? "启用" : "停用"}
                  </button>
                </td>
                <td className="font-mono-tech text-xs text-ink-muted">{formatDate(user.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfacePanel>
  );
}
