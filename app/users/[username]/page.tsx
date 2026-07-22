"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Eye, FileText, Settings, Shield, Tag, UserPlus, UserCheck } from "lucide-react";
import { EmptyState, SiteShell, SurfacePanel } from "@/components/page-chrome";
import { PostCardSkeleton } from "@/components/site-widgets";
import { UserAvatar } from "@/components/user-avatar";
import { ProfileEditingPanel } from "@/components/profile-editing-panel";
import { toast } from "@/components/toast";
import { useAuth, authFetch } from "@/lib/client-auth";
import { useDocumentTitle } from "@/lib/use-document-title";
import { formatDate } from "@/lib/utils";

interface PublicUser {
  username: string;
  display_name: string | null;
  avatar: string | null;
  role: string;
  roleLabel: string;
  bio: string | null;
  created_at: string;
  follower_count?: number;
  following_count?: number;
}

interface UserPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  mode: "article" | "moment";
  published_at: string | null;
  created_at: string;
  tags: string | null;
  view_count: number;
}

/** 个人中心 profile 数据（仅自己页面加载） */
interface ProfileData {
  user: any;
  groups: any[];
  pendingUsernameRequest: any;
  avatarHistory: string[];
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [user, setUser] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followPending, setFollowPending] = useState(false);
  const { user: currentUser } = useAuth();
  const router = useRouter();

  // 自己主页：编辑模式
  const isOwner = currentUser?.username === username;
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileForm, setProfileForm] = useState({ displayName: "", email: "", bio: "" });
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myImages, setMyImages] = useState<any[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);

  useDocumentTitle(user ? `${user.display_name || user.username} 的主页` : "用户主页");

  // 加载公开用户数据
  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    fetch(`/api/users/${encodeURIComponent(username)}`)
      .then(async (res) => {
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return null;
        }
        return (await res.json()) as { user?: PublicUser; posts?: UserPost[]; isFollowing?: boolean };
      })
      .then((data) => {
        if (cancelled || !data) return;
        setUser(data.user || null);
        setPosts(data.posts || []);
        setIsFollowing(!!data.isFollowing);
        setFollowerCount(data.user?.follower_count || 0);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  // 自己主页：加载 profile 编辑数据（点击编辑时懒加载）
  const loadProfileData = async () => {
    if (profileData || profileLoading) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    setProfileLoading(true);
    try {
      const [profileRes, postRes, imageRes] = await Promise.all([
        fetch("/api/profile", { headers }),
        fetch("/api/posts?mine=1&limit=100", { headers }),
        fetch("/api/upload", { headers }),
      ]);
      const pData = await profileRes.json() as { user?: any; groups?: any[]; pendingUsernameRequest?: any; avatarHistory?: string[] };
      const poData = await postRes.json() as { posts?: any[] };
      const iData = await imageRes.json() as { images?: any[] };

      setProfileData({
        user: pData.user || null,
        groups: pData.groups || [],
        pendingUsernameRequest: pData.pendingUsernameRequest || null,
        avatarHistory: pData.avatarHistory || [],
      });
      setMyPosts(poData.posts || []);
      setMyImages(iData.images || []);
      if (pData.user) {
        setProfileForm({
          displayName: pData.user.display_name || "",
          email: pData.user.email || "",
          bio: pData.user.bio || "",
        });
      }
    } catch {
      toast("加载编辑数据失败", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleToggleEdit = () => {
    if (!editMode) {
      loadProfileData();
    }
    setEditMode(!editMode);
  };

  const toggleFollow = async () => {
    if (!currentUser) {
      toast("请先登录后再关注", "error");
      router.push("/login");
      return;
    }
    if (followPending || !user) return;
    setFollowPending(true);
    try {
      const res = await authFetch(`/api/users/${encodeURIComponent(user.username)}/follow`, { method: "POST" });
      const data = (await res.json()) as { following?: boolean; followerCount?: number; error?: string };
      if (!res.ok) {
        toast(data.error || "操作失败", "error");
        return;
      }
      setIsFollowing(!!data.following);
      setFollowerCount(Number(data.followerCount ?? 0));
      toast(data.following ? "已关注" : "已取消关注");
    } catch {
      toast("网络异常，操作失败", "error");
    } finally {
      setFollowPending(false);
    }
  };

  if (loading) {
    return (
      <SiteShell>
        <section className="mx-auto max-w-5xl px-6 pb-20 pt-28">
          <div className="skeleton mx-auto h-40 max-w-xl" />
          <div className="mt-12">
            <PostCardSkeleton count={3} />
          </div>
        </section>
      </SiteShell>
    );
  }

  if (notFound || !user) {
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

  const currentGroup = profileData?.groups?.find((g: any) => g.name === profileData?.user?.role) || null;

  return (
    <SiteShell>
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-28">
        {/* 用户名片 */}
        <SurfacePanel className="p-7 md:p-10">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <UserAvatar username={null} avatar={user.avatar} size={96} linkToProfile={false} className="!rounded-full border-2 border-bronze/40" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <h1 className="font-serif-zh text-3xl font-bold tracking-[0.1em]">
                  {user.display_name || user.username}
                </h1>
                <span className="inline-flex items-center gap-1 border border-bronze/30 px-2 py-0.5 text-xs text-bronze">
                  <Shield size={11} />
                  {user.roleLabel}
                </span>
              </div>
              <p className="mt-2 font-mono-tech text-sm text-ink-muted">@{user.username}</p>
              {user.bio && <p className="mt-4 max-w-xl text-sm leading-loose text-ink-light">{user.bio}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                <span className="inline-flex items-center gap-1.5 font-mono-tech text-xs text-ink-muted">
                  <Calendar size={12} />
                  {formatDate(user.created_at)} 加入
                </span>
                <Link
                  href={`/users/${encodeURIComponent(user.username)}/follows`}
                  className="font-mono-tech text-xs text-ink-muted transition-colors hover:text-cyan-dark"
                >
                  <span className="text-cyan-dark">{followerCount}</span> 粉丝
                </Link>
                <span className="font-mono-tech text-xs text-ink-muted">·</span>
                <Link
                  href={`/users/${encodeURIComponent(user.username)}/follows?tab=following`}
                  className="font-mono-tech text-xs text-ink-muted transition-colors hover:text-cyan-dark"
                >
                  <span className="text-cyan-dark">{user.following_count || 0}</span> 关注
                </Link>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {isOwner ? (
                  <button
                    type="button"
                    onClick={handleToggleEdit}
                    className={editMode ? "btn-outline inline-flex items-center gap-2 px-5 py-2 text-sm" : "btn-tech inline-flex items-center gap-2 px-5 py-2 text-sm"}
                  >
                    <Settings size={15} />
                    {editMode ? "收起编辑" : "编辑资料"}
                  </button>
                ) : (
                  currentUser && (
                    <button
                      type="button"
                      onClick={toggleFollow}
                      disabled={followPending}
                      className={isFollowing ? "btn-outline inline-flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-50" : "btn-tech inline-flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-50"}
                    >
                      {isFollowing ? <UserCheck size={15} /> : <UserPlus size={15} />}
                      {isFollowing ? "已关注" : "关注 TA"}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </SurfacePanel>

        {/* 自己的编辑面板 */}
        {isOwner && editMode && (
          <div className="mt-12">
            {profileLoading ? (
              <div className="ink-loading mx-auto h-1 max-w-md" />
            ) : profileData?.user ? (
              <ProfileEditingPanel
                profile={profileData.user}
                setProfile={(u: any) => setProfileData((prev) => prev ? { ...prev, user: u } : prev)}
                profileForm={profileForm}
                setProfileForm={setProfileForm}
                groups={profileData.groups}
                currentGroup={currentGroup}
                pendingUsernameRequest={profileData.pendingUsernameRequest}
                setPendingUsernameRequest={(r: any) => setProfileData((prev) => prev ? { ...prev, pendingUsernameRequest: r } : prev)}
                posts={myPosts}
                setPosts={setMyPosts}
                images={myImages}
                setImages={setMyImages}
                avatarHistory={profileData.avatarHistory}
                setAvatarHistory={(h: string[]) => setProfileData((prev) => prev ? { ...prev, avatarHistory: h } : prev)}
                token={localStorage.getItem("token")}
                authHeaders={{ Authorization: `Bearer ${localStorage.getItem("token")}` }}
              />
            ) : null}
          </div>
        )}

        {/* 发布的文章 */}
        <div className="mt-12">
          <h2 className="flex items-center gap-2 font-serif-zh text-2xl font-bold tracking-[0.1em]">
            <FileText size={22} className="text-bronze" />
            发布的文章（{posts.length}）
          </h2>

          {posts.length === 0 ? (
            <SurfacePanel className="mt-8 p-6 text-sm text-ink-muted">还没有发布过内容。</SurfacePanel>
          ) : (
            <div className="mt-8 divide-y divide-mist/70">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group flex items-baseline gap-5 px-2 py-5 transition-colors hover:bg-paper/60">
                  <span className="shrink-0 font-mono-tech text-xs text-ink-muted">
                    {formatDate(post.published_at || post.created_at)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif-zh text-lg font-semibold tracking-[0.06em] transition-colors group-hover:text-cyan-dark">
                      {post.title}
                    </span>
                    {post.excerpt && (
                      <span className="mt-1 block truncate text-sm text-ink-muted">{post.excerpt}</span>
                    )}
                    {post.tags && (
                      <span className="mt-1 flex items-center gap-1 text-xs text-bronze">
                        <Tag size={11} />
                        {post.tags.split(",").map((t) => t.trim()).filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </span>
                  <span className="hidden shrink-0 items-center gap-1 font-mono-tech text-xs text-ink-muted sm:inline-flex">
                    <Eye size={12} />
                    {post.view_count}
                  </span>
                  <ArrowRight size={15} className="shrink-0 self-center text-bronze opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
