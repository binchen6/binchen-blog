"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BarChart3, BookOpen, Image, MessageCircle, Shield, Trash2, UserCog } from "lucide-react";
import { EmptyState, PageHeader, SiteShell, SurfacePanel } from "@/components/page-chrome";
import { formatDate } from "@/lib/utils";

interface UserRow {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  role: string;
  is_active: number;
  created_at: string;
}

interface PostRow {
  id: number;
  title: string;
  slug: string;
  status: string;
  mode: string;
  author_username?: string;
  created_at: string;
  published_at: string | null;
}

interface GuestbookRow {
  id: number;
  name: string;
  content: string;
  created_at: string;
}

interface CommentRow {
  id: number;
  name: string;
  content: string;
  post_title: string | null;
  post_slug: string | null;
  created_at: string;
}

interface ImageRow {
  id: number;
  url: string;
  filename: string;
  username?: string;
  created_at: string;
}

interface UsernameRequestRow {
  id: number;
  user_id: number;
  current_username: string;
  requested_username: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  owner: "站主",
  admin: "管理员",
  editor: "编辑",
  author: "作者",
  member: "成员",
};

type StatCard = [string, number | undefined, LucideIcon];

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<UserRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [guestbook, setGuestbook] = useState<GuestbookRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [usernameRequests, setUsernameRequests] = useState<UsernameRequestRow[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  async function loadAdminData() {
    if (!token) {
      setError("请先登录站主或管理员账号。");
      setReady(true);
      return;
    }
    try {
      const [statsRes, usersRes, postsRes, guestbookRes, commentsRes, imagesRes, usernameRequestsRes] = await Promise.all([
        fetch("/api/admin", { headers: authHeaders }),
        fetch("/api/admin/users", { headers: authHeaders }),
        fetch("/api/posts?admin=1&limit=100", { headers: authHeaders }),
        fetch("/api/guestbook", { headers: authHeaders }),
        fetch("/api/admin/comments", { headers: authHeaders }),
        fetch("/api/upload?all=1&limit=100", { headers: authHeaders }),
        fetch("/api/admin/username-requests", { headers: authHeaders }),
      ]);

      if (!statsRes.ok) {
        setError("无权访问管理员控制台。");
        setReady(true);
        return;
      }

      const statsData = await statsRes.json() as { stats?: Record<string, number> };
      const usersData = await usersRes.json() as { users?: UserRow[] };
      const postsData = await postsRes.json() as { posts?: PostRow[] };
      const guestbookData = await guestbookRes.json() as { entries?: GuestbookRow[] };
      const commentsData = await commentsRes.json() as { comments?: CommentRow[] };
      const imagesData = await imagesRes.json() as { images?: ImageRow[] };
      const usernameRequestsData = await usernameRequestsRes.json() as { requests?: UsernameRequestRow[] };

      setStats(statsData.stats || {});
      setUsers(usersData.users || []);
      setPosts(postsData.posts || []);
      setGuestbook(guestbookData.entries || []);
      setComments(commentsData.comments || []);
      setImages(imagesData.images || []);
      setUsernameRequests(usernameRequestsData.requests || []);
    } catch {
      setError("管理员数据加载失败。");
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateUser = async (user: UserRow, patch: { role?: string; isActive?: boolean }) => {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(patch),
    });
    const data = await res.json() as { user?: UserRow; error?: string };
    if (!res.ok || !data.user) {
      alert(data.error || "更新用户失败");
      return;
    }
    setUsers((current) => current.map((item) => item.id === user.id ? data.user! : item));
  };

  const deletePost = async (slug: string) => {
    if (!confirm("确定删除这篇文章吗？")) return;
    const res = await fetch(`/api/posts/${slug}`, { method: "DELETE", headers: authHeaders });
    if (res.ok) setPosts((current) => current.filter((post) => post.slug !== slug));
    else alert("删除文章失败");
  };

  const deleteGuestbook = async (id: number) => {
    const res = await fetch(`/api/guestbook?id=${id}`, { method: "DELETE", headers: authHeaders });
    if (res.ok) setGuestbook((current) => current.filter((entry) => entry.id !== id));
    else alert("删除留言失败");
  };

  const deleteComment = async (id: number) => {
    const res = await fetch(`/api/admin/comments?id=${id}`, { method: "DELETE", headers: authHeaders });
    if (res.ok) setComments((current) => current.filter((comment) => comment.id !== id));
    else alert("删除评论失败");
  };

  const deleteImage = async (id: number) => {
    const res = await fetch(`/api/images/${id}`, { method: "DELETE", headers: authHeaders });
    if (res.ok) setImages((current) => current.filter((image) => image.id !== id));
    else alert("删除图片失败");
  };

  const reviewUsernameRequest = async (id: number, action: "approve" | "reject") => {
    const res = await fetch(`/api/admin/username-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ action }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) {
      alert(data.error || "处理用户名申请失败");
      return;
    }
    setUsernameRequests((current) => current.filter((item) => item.id !== id));
    if (action === "approve") {
      loadAdminData();
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
          <div className="mt-12 space-y-8">
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
                    <div className="flex gap-3 text-sm">
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
          </div>
        )}
      </section>
    </SiteShell>
  );
}
