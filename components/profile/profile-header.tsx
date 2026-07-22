"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Shield } from "lucide-react";
import { toast } from "@/components/toast";
import { UserAvatar } from "@/components/user-avatar";
import { storeAuth } from "@/lib/client-auth";
import { compressAvatarFile } from "@/lib/image-compress";
import type { ProfileUser, UserGroupInfo } from "./types";

interface ProfileHeaderProps {
  profile: ProfileUser;
  avatarHistory: string[];
  currentGroup: UserGroupInfo | null;
  authHeaders: Record<string, string>;
  token: string;
  onAvatarUpdated: (user: ProfileUser, avatarHistory: string[]) => void;
  onSelectGroup: (group: UserGroupInfo) => void;
}

/** 头像区：当前头像/上传更换/历史头像回切 + 用户组徽章 + 用户名/显示名称说明 */
export function ProfileHeader({ profile, avatarHistory, currentGroup, authHeaders, token, onAvatarUpdated, onSelectGroup }: ProfileHeaderProps) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 更新/恢复头像（服务端做历史轮换，最多 3 次）
  const updateAvatar = async (url: string) => {
    const res = await fetch("/api/profile/avatar", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ url }),
    });
    const data = (await res.json()) as { user?: ProfileUser; avatarHistory?: string[]; error?: string };
    if (!res.ok || !data.user) {
      toast(data.error || "头像更新失败", "error");
      return;
    }
    storeAuth(data.user, token);
    onAvatarUpdated(data.user, data.avatarHistory || []);
    toast("头像已更新");
  };

  // 头像上传：压缩 → 上传（purpose=avatar，不进图库）→ 更新头像（历史轮换）
  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const compressed = await compressAvatarFile(file);
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("purpose", "avatar");
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });
      const uploadData = (await uploadRes.json()) as { url?: string; error?: string };
      if (!uploadRes.ok || !uploadData.url) {
        toast(uploadData.error || "头像上传失败", "error");
        return;
      }
      await updateAvatar(uploadData.url);
    } catch {
      toast("头像上传失败", "error");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-5">
          <div className="flex flex-col items-center gap-2">
            <UserAvatar username={null} avatar={profile.avatar} size={80} linkToProfile={false} className="!rounded-full border-2 border-bronze/40" />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="text-xs text-cyan-dark transition-colors hover:text-bronze disabled:opacity-50"
            >
              {uploadingAvatar ? "上传中..." : "更换头像"}
            </button>
            <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div>
            <h2 className="font-serif-zh text-2xl font-semibold tracking-[0.08em]">@{profile.username}</h2>
            <p className="mt-2 text-sm text-ink-muted">{profile.display_name || "未设置显示名称"}</p>
            {avatarHistory.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 text-xs text-ink-muted">历史头像（点击可换回，最多保留 3 次）</div>
                <div className="flex gap-2">
                  {avatarHistory.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => updateAvatar(url)}
                      className="h-10 w-10 overflow-hidden rounded-full border border-mist transition-all hover:border-bronze hover:ring-2 hover:ring-bronze/30"
                      title="换回这个头像"
                    >
                      <img src={url} alt="历史头像" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {currentGroup && (
          <button type="button" onClick={() => onSelectGroup(currentGroup)} className="inline-flex items-center gap-2 border border-bronze/30 bg-paper/70 px-4 py-2 text-sm text-cyan-dark transition-colors hover:border-bronze">
            <Shield size={15} />
            {currentGroup.label}
          </button>
        )}
      </div>

      <div className="mb-6 grid gap-2 text-xs leading-loose text-ink-muted md:grid-cols-2">
        <div className="border border-cyan-dark/10 bg-paper/55 p-3">
          <span className="font-semibold text-ink-light">用户名</span> 是唯一账号标识，用于登录、审核和站内身份识别，修改需要管理员同意。
        </div>
        <div className="border border-cyan-dark/10 bg-paper/55 p-3">
          <span className="font-semibold text-ink-light">显示名称</span> 是公开昵称，会出现在文章、评论和导航栏，可以随时自己修改。
        </div>
      </div>
    </>
  );
}
