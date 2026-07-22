"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Search, UserCheck, UserMinus, UserPlus, Users } from "lucide-react";
import { EmptyState, SiteShell, SurfacePanel } from "@/components/page-chrome";
import { UserAvatar } from "@/components/user-avatar";
import { toast } from "@/components/toast";
import { useAuth, authFetch } from "@/lib/client-auth";
import { useDocumentTitle } from "@/lib/use-document-title";
import { formatDate } from "@/lib/utils";

interface FollowUser {
  username: string;
  display_name: string | null;
  avatar: string | null;
  bio: string | null;
  role: string;
  followed_at: string;
  iFollow: boolean;
  followsMe: boolean;
}

const PAGE_SIZE = 20;

export default function FollowsPage() {
  const params = useParams();
  const username = params.username as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const initialTab = searchParams.get("tab") === "following" ? "following" : "followers";
  const [tab, setTab] = useState<"followers" | "following">(initialTab);
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 客户端搜索过滤
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.display_name && u.display_name.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  useDocumentTitle(`${username} 的${tab === "followers" ? "粉丝" : "关注"}`);

  const load = useCallback(
    async (t: "followers" | "following", p: number, append: boolean) => {
      try {
        const res = await fetch(
          `/api/users/${encodeURIComponent(username)}/follows?type=${t}&page=${p}&limit=${PAGE_SIZE}`
        );
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = (await res.json()) as { users?: FollowUser[]; total?: number; isOwner?: boolean };
        const list = data.users || [];
        setUsers((prev) => (append ? [...prev, ...list] : list));
        setTotal(Number(data.total ?? 0));
        setIsOwner(!!data.isOwner);
      } catch {
        if (!append) setNotFound(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [username]
  );

  useEffect(() => {
    setLoading(true);
    setUsers([]);
    load(tab, 1, false);
  }, [tab, load]);

  const hasMore = users.length < total;
  const nextPage = Math.floor(users.length / PAGE_SIZE) + 1;

  const toggleFollow = async (target: FollowUser) => {
    if (!currentUser) {
      toast("请先登录后再关注", "error");
      router.push("/login");
      return;
    }
    if (pending) return;
    setPending(target.username);
    // 乐观更新：立即切换 UI 状态
    const prevIFollow = target.iFollow;
    setUsers((prev) => prev.map((u) => (u.username === target.username ? { ...u, iFollow: !prevIFollow } : u)));
    try {
      const res = await authFetch(`/api/users/${encodeURIComponent(target.username)}/follow`, { method: "POST" });
      const data = (await res.json()) as { following?: boolean; error?: string };
      if (!res.ok) {
        toast(data.error || "操作失败", "error");
        // 回滚
        setUsers((prev) => prev.map((u) => (u.username === target.username ? { ...u, iFollow: prevIFollow } : u)));
        return;
      }
      // 用服务器返回值同步
      const now = !!data.following;
      setUsers((prev) => prev.map((u) => (u.username === target.username ? { ...u, iFollow: now } : u)));
      toast(now ? "已关注" : "已取消关注");
    } catch {
      // 回滚
      setUsers((prev) => prev.map((u) => (u.username === target.username ? { ...u, iFollow: prevIFollow } : u)));
      toast("网络异常，操作失败", "error");
    } finally {
      setPending(null);
    }
  };

  const removeFollower = async (target: FollowUser) => {
    // 确认对话框
    const confirmed = window.confirm(`确认移除粉丝 ${target.display_name || target.username}？\n\n对方不会收到通知。`);
    if (!confirmed) return;

    if (pending) return;
    setPending(target.username);
    // 乐观更新：立即从列表移除
    const prevUsers = users;
    setUsers((prev) => prev.filter((u) => u.username !== target.username));
    setTotal((n) => Math.max(0, n - 1));
    try {
      const res = await authFetch(
        `/api/users/${encodeURIComponent(username)}/follows?target=${encodeURIComponent(target.username)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as { removed?: boolean; error?: string };
      if (!res.ok) {
        toast(data.error || "移除失败", "error");
        // 回滚
        setUsers(prevUsers);
        setTotal((n) => n + 1);
        return;
      }
      toast(`已移除粉丝 ${target.display_name || target.username}`);
    } catch {
      // 回滚
      setUsers(prevUsers);
      setTotal((n) => n + 1);
      toast("网络异常，移除失败", "error");
    } finally {
      setPending(null);
    }
  };

  if (loading) {
    return (
      <SiteShell>
        <section className="mx-auto max-w-3xl px-6 pb-20 pt-28">
          <div className="skeleton h-10 w-48" />
          <div className="mt-8 space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16" />
            ))}
          </div>
        </section>
      </SiteShell>
    );
  }

  if (notFound) {
    return (
      <SiteShell>
        <section className="px-6 pb-20 pt-28">
          <EmptyState
            title="用户不存在"
            description="这个用户可能已注销，或链接有误。"
            action={
              <Link href="/blog" className="btn-ink inline-flex items-center gap-2">
                <ArrowLeft size={14} />
                返回文章列表
              </Link>
            }
          />
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-28">
        <Link
          href={`/users/${encodeURIComponent(username)}`}
          className="inline-flex items-center gap-2 font-mono-tech text-xs text-ink-muted transition-colors hover:text-cyan-dark"
        >
          <ArrowLeft size={13} />
          返回 @{username} 的主页
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <Users size={22} className="text-bronze" />
          <h1 className="font-serif-zh text-2xl font-bold tracking-[0.1em]">关注关系</h1>
        </div>

        {/* Tab 切换 */}
        <div className="mt-6 flex gap-1 border-b border-mist/70">
          {([
            ["followers", "粉丝"],
            ["following", "关注中"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 px-5 py-2.5 text-sm tracking-[0.08em] transition-colors ${
                tab === key ? "border-cinnabar text-ink" : "border-transparent text-ink-muted hover:text-ink-light"
              }`}
            >
              {label}
              {tab === key && <span className="ml-1.5 font-mono-tech text-xs text-ink-muted">{total}</span>}
            </button>
          ))}
        </div>

        {/* 搜索过滤 */}
        {users.length > 0 && (
          <div className="mt-4">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="搜索用户名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-mist bg-paper py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink-muted/60 focus:border-cyan-dark focus:outline-none"
              />
            </div>
            {searchQuery && filteredUsers.length === 0 && (
              <p className="mt-2 text-center text-xs text-ink-muted">没有找到匹配的用户</p>
            )}
          </div>
        )}

        {users.length === 0 ? (
          <EmptyState
            title={tab === "followers" ? "还没有粉丝" : "还没有关注任何人"}
            description={
              tab === "followers"
                ? "发布更多优质内容，自然会吸引粉丝关注。"
                : "去发现更多有趣的人，点击关注建立连接。"
            }
          />
        ) : (
          <div className="divide-y divide-mist/70">
            {filteredUsers.map((u) => {
              const isSelf = currentUser?.username === u.username;
              const mutual = u.iFollow && u.followsMe;
              return (
                <div key={u.username} className="flex items-center gap-3 px-2 py-4 sm:gap-4">
                  <UserAvatar
                    username={u.username}
                    avatar={u.avatar}
                    size={48}
                    className="!rounded-full border border-mist/70"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/users/${encodeURIComponent(u.username)}`}
                        className="truncate font-serif-zh text-base font-semibold tracking-[0.05em] transition-colors hover:text-cyan-dark"
                      >
                        {u.display_name || u.username}
                      </Link>
                      {currentUser && !isSelf && mutual && (
                        <span className="border border-dai/40 px-1.5 py-0.5 text-[10px] tracking-wider text-dai">互相关注</span>
                      )}
                      {currentUser && !isSelf && !mutual && u.followsMe && (
                        <span className="border border-mist px-1.5 py-0.5 text-[10px] tracking-wider text-ink-muted">关注了你</span>
                      )}
                    </div>
                    <p className="mt-1 font-mono-tech text-xs text-ink-muted">
                      @{u.username}
                      <span className="mx-1.5 text-mist">·</span>
                      <span className="text-bronze">{formatDate(u.followed_at)}</span>
                      {tab === "followers" ? " 关注了你" : " 被你关注"}
                    </p>
                    {u.bio && <p className="mt-1 truncate text-sm text-ink-light">{u.bio}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    {currentUser && !isSelf && (
                      <button
                        type="button"
                        onClick={() => toggleFollow(u)}
                        disabled={pending === u.username}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs disabled:opacity-50 ${
                          u.iFollow ? "btn-outline" : "btn-tech"
                        }`}
                      >
                        {u.iFollow ? <UserCheck size={13} /> : <UserPlus size={13} />}
                        {u.iFollow ? "已关注" : u.followsMe ? "回关" : "关注"}
                      </button>
                    )}
                    {isOwner && tab === "followers" && (
                      <button
                        type="button"
                        onClick={() => removeFollower(u)}
                        disabled={pending === u.username}
                        title="移除该粉丝（不会通知对方）"
                        className="inline-flex items-center gap-1 border border-mist px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-cinnabar hover:text-cinnabar disabled:opacity-50"
                      >
                        <UserMinus size={13} />
                        移除
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasMore && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setLoadingMore(true);
                load(tab, nextPage, true);
              }}
              disabled={loadingMore}
              className="btn-outline inline-flex items-center gap-2 px-6 py-2 text-sm disabled:opacity-50"
            >
              {loadingMore && <Loader2 size={14} className="animate-spin" />}
              加载更多（{users.length}/{total}）
            </button>
          </div>
        )}
      </section>
    </SiteShell>
  );
}

