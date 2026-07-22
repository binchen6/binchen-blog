"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BarChart3, BookOpen, Image, LayoutDashboard, Megaphone, MessageCircle, MessagesSquare, Shield, Users } from "lucide-react";
import { EmptyState, PageHeader, SiteShell } from "@/components/page-chrome";
import { toast } from "@/components/toast";
import { useDocumentTitle } from "@/lib/use-document-title";

import type { AnnouncementRow, CommentRow, GithubStorageStatus, GuestbookRow, ImageRow, PerformanceRunRow, PerformanceTaskRow, PostRow, UsernameRequestRow, UserRow } from "./_components/types";
import { AnnouncementsPanel } from "./_components/announcements-panel";
import { ImagesPanel } from "./_components/images-panel";
import { InteractionsPanel } from "./_components/interactions-panel";
import { OverviewPanel } from "./_components/overview-panel";
import { PerformancePanel } from "./_components/performance-panel";
import { PostsPanel } from "./_components/posts-panel";
import { UsersPanel } from "./_components/users-panel";

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
  const [performanceRuns, setPerformanceRuns] = useState<PerformanceRunRow[]>([]);
  const [githubStorage, setGithubStorage] = useState<GithubStorageStatus | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

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
        const data = (await res.json()) as { taskStats?: PerformanceTaskRow[]; recentRuns?: PerformanceRunRow[] };
        setPerformanceTasks(data.taskStats || []);
        setPerformanceRuns(
          (data.recentRuns || []).map((run) => {
            let detailsText = "";
            try {
              const d = JSON.parse(run.details || "{}") as { tasks?: number; failures?: number };
              detailsText = `${d.tasks ?? "?"} 个任务 · ${d.failures ?? 0} 失败`;
            } catch {
              detailsText = "";
            }
            return { ...run, detailsText };
          })
        );
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

  const handleUsersChanged = () => {
    setLoadedTabs((current) => {
      const next = new Set(current);
      next.delete("users");
      return next;
    });
    loadTabData("users");
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
                    onClick={() => setActiveTab(tab.key)}
                    className={
                      "inline-flex items-center gap-2 px-4 py-2 font-serif-zh text-sm tracking-[0.08em] transition-colors" +
                      (activeTab === tab.key ? " bg-cyan-dark text-bronze-light" : " text-ink-light hover:text-ink")
                    }
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {tabLoading && <div className="ink-loading mb-6 h-1 max-w-md" />}

            {activeTab === "overview" && <OverviewPanel stats={stats} githubStorage={githubStorage} />}
            {activeTab === "posts" && <PostsPanel posts={posts} setPosts={setPosts} authHeaders={authHeaders} />}
            {activeTab === "users" && (
              <UsersPanel
                users={users}
                setUsers={setUsers}
                usernameRequests={usernameRequests}
                setUsernameRequests={setUsernameRequests}
                authHeaders={authHeaders}
                onUsersChanged={handleUsersChanged}
              />
            )}
            {activeTab === "interactions" && (
              <InteractionsPanel
                guestbook={guestbook}
                setGuestbook={setGuestbook}
                comments={comments}
                setComments={setComments}
                authHeaders={authHeaders}
              />
            )}
            {activeTab === "images" && <ImagesPanel images={images} setImages={setImages} authHeaders={authHeaders} />}
            {activeTab === "announcements" && (
              <AnnouncementsPanel announcements={announcements} setAnnouncements={setAnnouncements} authHeaders={authHeaders} />
            )}
            {activeTab === "performance" && <PerformancePanel tasks={performanceTasks} runs={performanceRuns} />}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
