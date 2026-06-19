"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Copy, Image, Info, Pen, Save, Send, Shield, Trash2, UserCog, X } from "lucide-react";
import { EmptyState, PageHeader, SiteShell, SurfacePanel } from "@/components/page-chrome";
import { formatDate } from "@/lib/utils";

interface ProfileUser {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  avatar: string | null;
  role: string;
  bio: string | null;
}

interface UserGroupInfo {
  name: string;
  label: string;
  permissions: string[];
}

interface UsernameRequest {
  id: number;
  requested_username: string;
  created_at: string;
}

interface ManagePost {
  id: number;
  title: string;
  slug: string;
  status: "published" | "draft";
  mode: "article" | "moment";
  created_at: string;
  published_at: string | null;
}

interface ImageAsset {
  id: number;
  url: string;
  filename: string;
  size: number;
  created_at: string;
}

const roleDescriptions: Record<string, string> = {
  "*": "拥有全部权限",
  "admin:access": "访问管理员控制台",
  "posts:manage_all": "管理全部文章",
  "posts:create": "发布文章",
  "posts:manage_own": "管理自己的文章",
  "comments:manage_all": "管理全部评论",
  "comments:create": "发表评论",
  "guestbook:manage_all": "管理全部留言",
  "guestbook:create": "发布留言",
  "users:manage": "管理用户与用户名申请",
  "images:upload": "上传图片",
  "images:manage_own": "管理自己的图片",
  "images:manage_all": "管理全部图片",
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [profileForm, setProfileForm] = useState({ displayName: "", email: "", avatar: "", bio: "" });
  const [groups, setGroups] = useState<UserGroupInfo[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<UserGroupInfo | null>(null);
  const [pendingUsernameRequest, setPendingUsernameRequest] = useState<UsernameRequest | null>(null);
  const [requestedUsername, setRequestedUsername] = useState("");
  const [posts, setPosts] = useState<ManagePost[]>([]);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [requestingUsername, setRequestingUsername] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    let cancelled = false;
    async function loadData() {
      try {
        const [profileRes, postRes, imageRes] = await Promise.all([
          fetch("/api/profile", { headers: authHeaders }),
          fetch("/api/posts?mine=1&limit=100", { headers: authHeaders }),
          fetch("/api/upload", { headers: authHeaders }),
        ]);
        const profileData = await profileRes.json() as { user?: ProfileUser; groups?: UserGroupInfo[]; pendingUsernameRequest?: UsernameRequest | null };
        const postData = await postRes.json() as { posts?: ManagePost[] };
        const imageData = await imageRes.json() as { images?: ImageAsset[] };

        if (!cancelled) {
          setProfile(profileData.user || null);
          setGroups(profileData.groups || []);
          setPendingUsernameRequest(profileData.pendingUsernameRequest || null);
          setPosts(postData.posts || []);
          setImages(imageData.images || []);
          if (profileData.user) {
            setProfileForm({
              displayName: profileData.user.display_name || "",
              email: profileData.user.email || "",
              avatar: profileData.user.avatar || "",
              bio: profileData.user.bio || "",
            });
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const currentGroup = groups.find((group) => group.name === profile?.role) || null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json() as { user?: ProfileUser; error?: string };
      if (!res.ok || !data.user) {
        alert(data.error || "保存资料失败");
        return;
      }
      setProfile(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      alert("个人资料已保存");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUsernameRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestingUsername(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ requestedUsername }),
      });
      const data = await res.json() as { request?: UsernameRequest; error?: string };
      if (!res.ok || !data.request) {
        alert(data.error || "提交用户名申请失败");
        return;
      }
      setPendingUsernameRequest(data.request);
      setRequestedUsername("");
      alert("用户名修改申请已提交，等待管理员审核");
    } finally {
      setRequestingUsername(false);
    }
  };

  const deletePost = async (slug: string) => {
    if (!confirm("确定删除这篇文章吗？相关评论也会被删除。")) return;
    const res = await fetch(`/api/posts/${slug}`, { method: "DELETE", headers: authHeaders });
    if (res.ok) setPosts((current) => current.filter((post) => post.slug !== slug));
    else alert("删除文章失败");
  };

  const deleteImage = async (id: number) => {
    if (!confirm("确定删除这张图片吗？")) return;
    const res = await fetch(`/api/images/${id}`, { method: "DELETE", headers: authHeaders });
    if (res.ok) setImages((current) => current.filter((image) => image.id !== id));
    else alert("删除图片失败");
  };

  const copyImageUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    alert("图片链接已复制");
  };

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-28">
        <PageHeader
          eyebrow="Profile"
          title="个人中心"
          icon={<UserCog size={22} />}
          description="管理个人资料、用户名申请、已发布文章和上传图片。"
        />

        {loading ? (
          <div className="mt-12 ink-loading mx-auto h-1 max-w-md" />
        ) : !profile ? (
          <EmptyState title="未登录" description="请先登录后再进入个人中心。" />
        ) : (
          <div className="mt-12 space-y-8">
            <SurfacePanel className="p-6 md:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif-zh text-2xl font-semibold tracking-[0.08em]">@{profile.username}</h2>
                  <div className="mt-4 grid gap-2 text-xs leading-loose text-ink-muted md:grid-cols-2">
                    <div className="border border-cyan-dark/10 bg-paper/55 p-3">
                      <span className="font-semibold text-ink-light">用户名</span> 是唯一账号标识，用于登录、审核和站内身份识别，修改需要管理员同意。
                    </div>
                    <div className="border border-cyan-dark/10 bg-paper/55 p-3">
                      <span className="font-semibold text-ink-light">显示名称</span> 是公开昵称，会出现在文章、评论和导航栏，可以随时自己修改。
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">{profile.display_name || "未设置显示名称"}</p>
                </div>
                {currentGroup && (
                  <button type="button" onClick={() => setSelectedGroup(currentGroup)} className="inline-flex items-center gap-2 border border-bronze/30 bg-paper/70 px-4 py-2 text-sm text-cyan-dark transition-colors hover:border-bronze">
                    <Shield size={15} />
                    {currentGroup.label}
                  </button>
                )}
              </div>

              <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <form onSubmit={handleSaveProfile} className="grid gap-4 md:grid-cols-2">
                  <input value={profileForm.displayName} onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })} className="w-full bg-paper/60" placeholder="显示名称" />
                  <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full bg-paper/60" required />
                  <input type="url" value={profileForm.avatar} onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })} className="w-full bg-paper/60 md:col-span-2" placeholder="头像 URL" />
                  <textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} className="h-28 w-full resize-none bg-paper/60 md:col-span-2" maxLength={240} placeholder="个人简介" />
                  <button type="submit" disabled={savingProfile} className="btn-tech inline-flex items-center gap-2 disabled:opacity-50">
                    <Save size={16} />
                    {savingProfile ? "保存中..." : "保存个人资料"}
                  </button>
                </form>

                <div className="space-y-5">
                  <form onSubmit={handleUsernameRequest} className="border border-cyan-dark/10 bg-paper/55 p-4">
                    <label className="mb-2 block text-sm font-semibold text-ink-light">申请修改用户名</label>
                    <input value={requestedUsername} onChange={(e) => setRequestedUsername(e.target.value)} className="mb-3 w-full bg-paper/60" placeholder="3-24 位字母、数字、_ 或 -" disabled={!!pendingUsernameRequest} />
                    {pendingUsernameRequest ? (
                      <p className="text-sm leading-loose text-ink-muted">已申请修改为 <span className="text-cyan-dark">{pendingUsernameRequest.requested_username}</span>，等待管理员审核。</p>
                    ) : (
                      <button type="submit" disabled={requestingUsername || !requestedUsername.trim()} className="btn-outline inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50">
                        <Send size={14} />
                        {requestingUsername ? "提交中..." : "提交申请"}
                      </button>
                    )}
                  </form>

                  <div className="border border-cyan-dark/10 bg-paper/55 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-light">
                      <Info size={15} className="text-bronze" />
                      用户组规则
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {groups.map((group) => (
                        <button key={group.name} type="button" onClick={() => setSelectedGroup(group)} className="border border-mist bg-paper/70 px-3 py-1.5 text-xs text-ink-light transition-colors hover:border-bronze hover:text-cyan-dark">
                          {group.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </SurfacePanel>

            <div className="grid gap-8 lg:grid-cols-[24rem_minmax(0,1fr)]">
              <SurfacePanel className="p-6">
                <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
                  <BookOpen size={20} className="text-bronze" />
                  我的文章
                </h2>
                {posts.length === 0 ? (
                  <p className="text-sm text-ink-muted">暂无文章。</p>
                ) : (
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div key={post.slug} className="border border-cyan-dark/10 bg-paper/55 p-3">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="line-clamp-1 text-sm font-semibold">{post.title}</span>
                          <span className="shrink-0 text-[11px] text-bronze">{post.status === "published" ? "已发布" : "草稿"}</span>
                        </div>
                        <div className="mb-3 font-mono-tech text-[11px] text-ink-muted">{formatDate(post.published_at || post.created_at)}</div>
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/write?edit=${encodeURIComponent(post.slug)}`} className="inline-flex items-center gap-1 text-xs text-cyan-dark hover:text-bronze">
                            <Pen size={12} />
                            去撰写页修改
                          </Link>
                          <button type="button" onClick={() => deletePost(post.slug)} className="inline-flex items-center gap-1 text-xs text-cinnabar hover:text-cinnabar-dark">
                            <Trash2 size={12} />
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SurfacePanel>

              <SurfacePanel className="p-6">
                <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
                  <Image size={20} className="text-bronze" />
                  我的图片
                </h2>
                {images.length === 0 ? (
                  <p className="text-sm text-ink-muted">还没有上传过图片。</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {images.map((image) => (
                      <div key={image.id} className="overflow-hidden border border-cyan-dark/10 bg-paper/55">
                        <a href={image.url} target="_blank" rel="noreferrer" className="block aspect-square bg-paper-warm">
                          <img src={image.url} alt={image.filename} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                        </a>
                        <div className="p-3">
                          <div className="line-clamp-1 text-xs">{image.filename}</div>
                          <div className="mt-2 flex gap-3">
                            <button type="button" onClick={() => copyImageUrl(image.url)} className="inline-flex items-center gap-1 text-xs text-cyan-dark">
                              <Copy size={12} />
                              复制
                            </button>
                            <button type="button" onClick={() => deleteImage(image.id)} className="inline-flex items-center gap-1 text-xs text-cinnabar">
                              <Trash2 size={12} />
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SurfacePanel>
            </div>
          </div>
        )}
      </section>

      {selectedGroup && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/35 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <SurfacePanel className="w-full max-w-lg p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-cyan-dark/70">User Group</div>
                <h2 className="mt-2 font-serif-zh text-2xl font-semibold tracking-[0.08em]">{selectedGroup.label}</h2>
              </div>
              <button type="button" onClick={() => setSelectedGroup(null)} className="grid h-9 w-9 place-items-center border border-cyan-dark/10 bg-paper/70 text-ink-muted hover:text-cinnabar" aria-label="关闭">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {selectedGroup.permissions.map((permission) => (
                <div key={permission} className="border border-cyan-dark/10 bg-paper/55 p-3">
                  <div className="font-mono-tech text-xs text-cyan-dark">{permission}</div>
                  <div className="mt-1 text-sm text-ink-light">{roleDescriptions[permission] || "自定义权限"}</div>
                </div>
              ))}
            </div>
          </SurfacePanel>
        </div>
      )}
    </SiteShell>
  );
}
