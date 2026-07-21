"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BarChart3, BookOpen, HardDrive, Image, LayoutDashboard, Megaphone, MessageCircle, MessagesSquare, Shield, Trash2, UserCog, Users } from "lucide-react";
import { EmptyState, PageHeader, SiteShell, SurfacePanel } from "@/components/page-chrome";
import { toast } from "@/components/toast";
import { useDocumentTitle } from "@/lib/use-document-title";
import { cn, formatDate } from "@/lib/utils";

interface UserRow {
  id: number;
  username: string;
  email: string;
  display_name?: string | null;
  role: string;
  is_active: number;
  created_at: string;
}

interface PostRow {
  slug: string;
  title: string;
  mode: string;
  status: string;
  is_featured: number;
  featured_rank: number;
  author_username?: string | null;
}

interface GuestbookRow {
  id: number;
  name: string;
  content: string;
}

interface CommentRow {
  id: number;
  name: string;
  content: string;
  post_title?: string | null;
}

interface ImageRow {
  id: number;
  url: string;
  filename: string;
}

interface UsernameRequestRow {
  id: number;
  current_username: string;
  requested_username: string;
  display_name?: string | null;
  created_at: string;
}

interface PerformanceTaskRow {
  task: string;
  runs: number;
  avg_duration_ms: number;
  max_duration_ms: number;
}

interface AnnouncementRow {
  id: number;
  title: string;
  content: string;
  created_at: string;
  created_by_name?: string | null;
  created_by_username?: string | null;
}

interface GithubStorageStatus {
  configured: boolean;
  missing: string[];
  owner?: string;
  repo?: string;
  branch: string;
  uploadDir: string;
  tokenPresent: boolean;
  tokenLength: number;
  repoCheck: { ok: boolean; status?: number; message?: string };
  sources?: Record<string, string>;
  runtimeEnvPresence?: Record<string, boolean>;
  buildEnvPresence?: Record<string, boolean>;
  relatedRuntimeEnvKeys?: string[];
}

const roleLabels: Record<string, string> = {
  owner: "站主",
  admin: "管理员",
  editor: "编辑",
  author: "作者",
  member: "成员",
};

type StatCard = [string, number | undefined, LucideIcon];
type TabKey = "overview" | "posts" | "users" | "interactions" | "images" | "performance" | "announcements";

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "overview", label: "概览", icon: LayoutDashboard },
  { key: "posts", label: "文章", icon: BookOpen },
  { key: "users", label: "用户", icon: Users },
  { key: "interactions", label: "互动", icon: MessagesSquare },
  { key: "images", label: "图片", icon: Image },
  { key: "announcements", label: "公告", icon: Megaphone },
  { key: "performance", label: "性能", icon: BarChart3 },
];

export default function AdminPage() {
  useDocumentTitle("控制台");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [loadedTabs, setLoadedTabs] = useState<Set<TabKey>>(new Set());
  const [tabLoading, setTabLoading] = useState(false);

  const [stats, setStats] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<UserRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [guestbook, setGuestbook] = useState<GuestbookRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [usernameRequests, setUsernameRequests] = useState<UsernameRequestRow[]>([]);
  const [performanceTasks, setPerformanceTasks] = useState<PerformanceTaskRow[]>([]);
  const [githubStorage, setGithubStorage] = useState<GithubStorageStatus | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "" });
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // 每个 Tab 按需加载，已加载过的 Tab 切回不重复请求
  async function loadTabData(tab: TabKey) {
    if (!token) {
      setError("请先登录站主或管理员账号。");
      setReady(true);
      return;
    }

    const requests: Promise<Response>[] = [];
    const handlers: ((res: Response) => Promise<void>)[] = [];
    const add = (url: string, handler: (res: Response) => Promise<void>) => {
      requests.push(fetch(url, { headers: authHeaders }));
      handlers.push(handler);
    };

    if (tab === "overview") {
      add("/api/admin", async (res) => {
        if (!res.ok) throw new Error("forbidden");
        const data = (await res.json()) as { stats?: Record<string, number> };
        setStats(data.stats || {});
      });
      add("/api/admin/github-storage", async (res) => {
        setGithubStorage((await res.json()) as GithubStorageStatus);
      });
    } else if (tab === "posts") {
      add("/api/posts?admin=1&limit=100", async (res) => {
        const data = (await res.json()) as { posts?: PostRow[] };
        setPosts(data.posts || []);
      });
    } else if (tab === "users") {
      add("/api/admin/users", async (res) => {
        const data = (await res.json()) as { users?: UserRow[] };
        setUsers(data.users || []);
      });
      add("/api/admin/username-requests", async (res) => {
        const data = (await res.json()) as { requests?: UsernameRequestRow[] };
        setUsernameRequests(data.requests || []);
      });
    } else if (tab === "interactions") {
      add("/api/guestbook", async (res) => {
        const data = (await res.json()) as { entries?: GuestbookRow[] };
        setGuestbook(data.entries || []);
      });
      add("/api/admin/comments", async (res) => {
        const data = (await res.json()) as { comments?: CommentRow[] };
        setComments(data.comments || []);
      });
    } else if (tab === "images") {
      add("/api/upload?all=1&limit=100", async (res) => {
        const data = (await res.json()) as { images?: ImageRow[] };
        setImages(data.images || []);
      });
    } else if (tab === "performance") {
      add("/api/performance", async (res) => {
        const data = (await res.json()) as { slowTasks?: PerformanceTaskRow[] };
        setPerformanceTasks(data.slowTasks || []);
      });
    } else if (tab === "announcements") {
      add("/api/announcements?all=1", async (res) => {
        const data = (await res.json()) as { announcements?: AnnouncementRow[] };
        setAnnouncements(data.announcements || []);
      });
    }

    if (requests.length === 0) return;

    setTabLoading(true);
    try {
      const responses = await Promise.all(requests);
      for (let i = 0; i < responses.length; i += 1) {
        await handlers[i](responses[i]);
      }
      setLoadedTabs((current) => new Set(current).add(tab));
    } catch (err) {
      if (err instanceof Error && err.message === "forbidden") {
        setError("无权访问管理员控制台。");
      } else {
        toast("数据加载失败，可切换 Tab 重试", "error");
      }
    } finally {
      setTabLoading(false);
      setReady(true);
    }
  }

  useEffect(() => {
    if (!loadedTabs.has(activeTab)) {
      loadTabData(activeTab);
    } else {
      setReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
  };

  const updateUser = async (user: UserRow, patch: { role?: string; isActive?: boolean }) => {
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
  };

  const deletePost = async (slug: string) => {
    if (!confirm("确定删除这篇文章吗？")) return;
    const res = await fetch(`/api/posts/${slug}`, { method: "DELETE", headers: authHeaders });
    if (res.ok) setPosts((current) => current.filter((post) => post.slug !== slug));
    else toast("删除文章失败", "error");
  };

  const updateFeaturedPost = async (post: PostRow, isFeatured: boolean, featuredRank = post.featured_rank || 0) => {
    const res = await fetch("/api/admin/featured-posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ slug: post.slug, isFeatured, featuredRank }),
    });
    const data = await res.json() as { post?: PostRow; error?: string };
    if (!res.ok || !data.post) {
      toast(data.error || "更新精选状态失败", "error");
      return;
    }
    setPosts((current) => current.map((item) => item.slug === post.slug ? { ...item, ...data.post } : item));
  };

  const deleteGuestbook = async (id: number) => {
    const res = await fetch(`/api/guestbook?id=${id}`, { method: "DELETE", headers: authHeaders });
    if (res.ok) setGuestbook((current) => current.filter((entry) => entry.id !== id));
    else toast("删除留言失败", "error");
  };

  const deleteComment = async (id: number) => {
    const res = await fetch(`/api/admin/comments?id=${id}`, { method: "DELETE", headers: authHeaders });
    if (res.ok) setComments((current) => current.filter((comment) => comment.id !== id));
    else toast("删除评论失败", "error");
  };

  const deleteImage = async (id: number) => {
    const res = await fetch(`/api/images/${id}`, { method: "DELETE", headers: authHeaders });
    if (res.ok) setImages((current) => current.filter((image) => image.id !== id));
    else toast("删除图片失败", "error");
  };

  const sendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast("请填写公告标题和内容", "error");
      return;
    }
    setSendingAnnouncement(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(announcementForm),
      });
      const data = (await res.json()) as { announcement?: AnnouncementRow; notified?: number; error?: string };
      if (!res.ok || !data.announcement) {
        toast(data.error || "公告发送失败", "error");
        return;
      }
      setAnnouncements((current) => [data.announcement!, ...current]);
      setAnnouncementForm({ title: "", content: "" });
      toast(`公告已发送，通知了 ${data.notified ?? 0} 位用户`);
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const reviewUsernameRequest = async (id: number, action: "approve" | "reject") => {
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
    if (action === "approve") {
      setLoadedTabs((current) => {
        const next = new Set(current);
        next.delete("users");
        return next;
      });
      loadTabData("users");
    }
  };

  if (ready && error) {
    return (
      <SiteShell>
        <section className="px-6 pb-20 pt-28">
          <EmptyState title="无法访问" description={error} />
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-28">
        <PageHeader
          eyebrow="Admin"
          title="管理员控制台"
          icon={<Shield size={22} />}
          description="集中管理用户、文章、图片、留言与评论数据。"
        />

        {!ready ? (
          <div className="mt-12 ink-loading mx-auto h-1 max-w-md" />
        ) : (
          <div className="mt-12">
            {/* Tab 导航 */}
            <div className="mb-8 flex flex-wrap gap-1 border border-cyan-dark/10 bg-paper/70 p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => switchTab(tab.key)}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 font-serif-zh text-sm tracking-[0.08em] transition-colors",
                      activeTab === tab.key ? "bg-cyan-dark text-bronze-light" : "text-ink-light hover:text-ink"
                    )}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {tabLoading && <div className="ink-loading mb-6 h-1 max-w-md" />}

            {/* 概览 */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div className="grid gap-4 md:grid-cols-6">
                  {([
                    ["用户", stats.users, UserCog],
                    ["待审", stats.usernameRequests, Shield],
                    ["文章", stats.posts, BookOpen],
                    ["评论", stats.comments, MessageCircle],
                    ["留言", stats.guestbook, MessageCircle],
                    ["图片", stats.images, Image],
                  ] as StatCard[]).map(([label, value, Icon]) => (
                    <SurfacePanel key={String(label)} className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-ink-muted">{String(label)}</span>
                        <Icon size={18} className="text-bronze" />
                      </div>
                      <div className="mt-3 font-mono-tech text-3xl text-cyan-dark">{Number(value || 0)}</div>
                    </SurfacePanel>
                  ))}
                </div>

                <SurfacePanel className="p-6">
                  <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
                    <HardDrive size={20} className="text-bronze" />
                    GitHub 图片存储
                  </h2>
                  {!githubStorage ? (
                    <p className="text-sm text-ink-muted">暂未读取到存储检查结果。</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
                      <div className="border border-cyan-dark/10 bg-paper/55 p-4">
                        <div className="text-sm text-ink-muted">配置状态</div>
                        <div className={githubStorage.configured && githubStorage.repoCheck.ok ? "mt-2 text-lg font-semibold text-cyan-dark" : "mt-2 text-lg font-semibold text-cinnabar"}>
                          {githubStorage.configured && githubStorage.repoCheck.ok ? "可用" : "需要处理"}
                        </div>
                        <div className="mt-3 text-sm text-ink-light">
                          {githubStorage.configured
                            ? `已读取 ${githubStorage.owner || "-"} / ${githubStorage.repo || "-"}`
                            : `缺少：${githubStorage.missing.join(", ") || "未知变量"}`}
                        </div>
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <div className="border border-cyan-dark/10 bg-paper/55 p-4">
                          <div className="text-ink-muted">分支 / 目录</div>
                          <div className="mt-2 font-mono-tech text-xs text-cyan-dark">{githubStorage.branch} / {githubStorage.uploadDir}</div>
                        </div>
                        <div className="border border-cyan-dark/10 bg-paper/55 p-4">
                          <div className="text-ink-muted">Token</div>
                          <div className="mt-2 font-mono-tech text-xs text-cyan-dark">
                            {githubStorage.tokenPresent ? `已读取，长度 ${githubStorage.tokenLength}` : "未读取"}
                          </div>
                        </div>
                        <div className="border border-cyan-dark/10 bg-paper/55 p-4 md:col-span-2">
                          <div className="text-ink-muted">仓库权限检查</div>
                          <div className="mt-2 font-mono-tech text-xs text-cyan-dark">
                            {githubStorage.repoCheck.status ? `GitHub 返回 ${githubStorage.repoCheck.status}` : "未执行"}
                          </div>
                          {githubStorage.repoCheck.message && (
                            <div className="mt-2 text-xs text-cinnabar">{githubStorage.repoCheck.message}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </SurfacePanel>
              </div>
            )}

            {/* 文章管理 */}
            {activeTab === "posts" && (
              <SurfacePanel className="p-6">
                <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
                  <BookOpen size={20} className="text-bronze" />
                  文章管理
                </h2>
                <div className="grid gap-3">
                  {posts.map((post) => (
                    <div key={post.slug} className="flex flex-wrap items-center justify-between gap-3 border border-cyan-dark/10 bg-paper/55 p-4">
                      <div>
                        <div className="font-semibold">{post.title}</div>
                        <div className="mt-1 text-xs text-ink-muted">{post.author_username || "未知作者"} · {post.mode === "moment" ? "动态" : "文章"} · {post.status === "published" ? "已发布" : "草稿"}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {post.status === "published" && (
                          <label className="inline-flex items-center gap-2 text-xs text-ink-muted">
                            排序
                            <input
                              type="number"
                              min={0}
                              max={999}
                              value={post.featured_rank || 0}
                              onChange={(e) => {
                                const featuredRank = Number(e.target.value || 0);
                                setPosts((current) => current.map((item) => item.slug === post.slug ? { ...item, featured_rank: featuredRank } : item));
                              }}
                              onBlur={() => {
                                if (post.is_featured) updateFeaturedPost(post, true, post.featured_rank || 0);
                              }}
                              className="h-8 w-16 bg-paper/70 px-2"
                            />
                          </label>
                        )}
                        {post.status === "published" && (
                          <button type="button" onClick={() => updateFeaturedPost(post, !post.is_featured)} className="text-cyan-dark">
                            {post.is_featured ? "取消精选" : "设为精选"}
                          </button>
                        )}
                        {post.status === "published" && <Link href={`/blog/${post.slug}`} className="text-cyan-dark">查看</Link>}
                        <button type="button" onClick={() => deletePost(post.slug)} className="inline-flex items-center gap-1 text-cinnabar">
                          <Trash2 size={14} />
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </SurfacePanel>
            )}

            {/* 用户管理 */}
            {activeTab === "users" && (
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
            )}

            {/* 互动管理 */}
            {activeTab === "interactions" && (
              <div className="grid gap-8 lg:grid-cols-2">
                <SurfacePanel className="p-6">
                  <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
                    <MessageCircle size={20} className="text-bronze" />
                    留言管理
                  </h2>
                  <div className="space-y-3">
                    {guestbook.map((entry) => (
                      <div key={entry.id} className="border border-cyan-dark/10 bg-paper/55 p-4">
                        <div className="mb-2 flex justify-between gap-3">
                          <span className="font-semibold">{entry.name}</span>
                          <button type="button" onClick={() => deleteGuestbook(entry.id)} className="text-cinnabar"><Trash2 size={15} /></button>
                        </div>
                        <p className="line-clamp-2 text-sm text-ink-light">{entry.content}</p>
                      </div>
                    ))}
                  </div>
                </SurfacePanel>

                <SurfacePanel className="p-6">
                  <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
                    <BarChart3 size={20} className="text-bronze" />
                    评论管理
                  </h2>
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border border-cyan-dark/10 bg-paper/55 p-4">
                        <div className="mb-2 flex justify-between gap-3">
                          <span className="font-semibold">{comment.name}</span>
                          <button type="button" onClick={() => deleteComment(comment.id)} className="text-cinnabar"><Trash2 size={15} /></button>
                        </div>
                        <p className="line-clamp-2 text-sm text-ink-light">{comment.content}</p>
                        <div className="mt-2 text-xs text-ink-muted">{comment.post_title || "未知文章"}</div>
                      </div>
                    ))}
                  </div>
                </SurfacePanel>
              </div>
            )}

            {/* 图片管理 */}
            {activeTab === "images" && (
              <SurfacePanel className="p-6">
                <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
                  <Image size={20} className="text-bronze" />
                  图片管理
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                  {images.map((image) => (
                    <div key={image.id} className="overflow-hidden border border-cyan-dark/10 bg-paper/55">
                      <a href={image.url} target="_blank" rel="noreferrer" className="block aspect-square bg-paper-warm">
                        <img src={image.url} alt={image.filename} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      </a>
                      <div className="p-2">
                        <div className="line-clamp-1 text-xs">{image.filename}</div>
                        <button type="button" onClick={() => deleteImage(image.id)} className="mt-2 inline-flex items-center gap-1 text-xs text-cinnabar">
                          <Trash2 size={12} />
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </SurfacePanel>
            )}

            {/* 公告 */}
            {activeTab === "announcements" && (
              <div className="space-y-8">
                <SurfacePanel as="form" onSubmit={sendAnnouncement} className="space-y-5 p-6">
                  <h2 className="flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
                    <Megaphone size={20} className="text-bronze" />
                    发布公告
                  </h2>
                  <p className="text-sm text-ink-muted">公告会广播给所有注册用户：登录用户首次接收直接弹窗，访客在首页看到横幅。</p>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    className="w-full bg-paper/60"
                    placeholder="公告标题（80 字以内）"
                    maxLength={80}
                    required
                  />
                  <textarea
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    className="h-32 w-full resize-none bg-paper/60"
                    placeholder="公告内容..."
                    maxLength={2000}
                    required
                  />
                  <button type="submit" disabled={sendingAnnouncement} className="btn-tech inline-flex items-center gap-2 disabled:opacity-50">
                    <Megaphone size={16} />
                    {sendingAnnouncement ? "发送中..." : "发布公告"}
                  </button>
                </SurfacePanel>

                <SurfacePanel className="p-6">
                  <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
                    <Megaphone size={20} className="text-bronze" />
                    历史公告（{announcements.length}）
                  </h2>
                  {announcements.length === 0 ? (
                    <p className="text-sm text-ink-muted">还没有发布过公告。</p>
                  ) : (
                    <div className="space-y-3">
                      {announcements.map((item) => (
                        <div key={item.id} className="border border-cyan-dark/10 bg-paper/55 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold">{item.title}</span>
                            <span className="font-mono-tech text-xs text-ink-muted">{formatDate(item.created_at)}</span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-loose text-ink-light">{item.content}</p>
                          <div className="mt-2 text-xs text-ink-muted">发布人：{item.created_by_name || item.created_by_username || "未知"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </SurfacePanel>
              </div>
            )}

            {/* 性能 */}
            {activeTab === "performance" && (
              <SurfacePanel className="p-6">
                <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
                  <BarChart3 size={20} className="text-bronze" />
                  服务端性能调度
                </h2>
                {performanceTasks.length === 0 ? (
                  <p className="text-sm text-ink-muted">暂无调度记录。部署后配置 CRON_SECRET，并定时 POST /api/cron/performance 即可开始记录。</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <thead className="border-b border-cyan-dark/10 text-ink-muted">
                        <tr>
                          <th className="py-3">任务</th>
                          <th>7 日运行次数</th>
                          <th>平均耗时</th>
                          <th>最大耗时</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performanceTasks.map((task) => (
                          <tr key={task.task} className="border-b border-cyan-dark/5">
                            <td className="py-3 font-mono-tech text-xs text-cyan-dark">{task.task}</td>
                            <td>{task.runs}</td>
                            <td>{Math.round(Number(task.avg_duration_ms || 0))}ms</td>
                            <td>{Math.round(Number(task.max_duration_ms || 0))}ms</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SurfacePanel>
            )}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
