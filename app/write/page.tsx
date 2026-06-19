"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, FileText, Image, Images, LayoutList, Pen, Save, Send, Tag as TagIcon, Trash2, Upload } from "lucide-react";
import { EmptyState, PageHeader, SiteShell, SurfacePanel } from "@/components/page-chrome";
import { cn, formatDate } from "@/lib/utils";

type PostMode = "article" | "moment";
type PostStatus = "published" | "draft";

interface ImageAsset {
  id: number;
  url: string;
  filename: string;
  size: number;
  created_at: string;
}

interface ManagePost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  status: PostStatus;
  mode: PostMode;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface PostDetail extends ManagePost {
  content: string;
  cover_image: string | null;
  images: string | null;
  tags: string | null;
}

const MAX_CLIENT_UPLOAD_MB = 25;
const MAX_CLIENT_UPLOAD_BYTES = MAX_CLIENT_UPLOAD_MB * 1024 * 1024;

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [mode, setMode] = useState<PostMode>("article");
  const [status, setStatus] = useState<PostStatus>("published");
  const [images, setImages] = useState<string[]>([]);
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [posts, setPosts] = useState<ManagePost[]>([]);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    let cancelled = false;
    async function loadData() {
      try {
        const [imageRes, postRes] = await Promise.all([
          fetch("/api/upload", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/posts?mine=1&limit=100", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const imageData = (await imageRes.json()) as { images?: ImageAsset[] };
        const postData = (await postRes.json()) as { posts?: ManagePost[] };
        if (!cancelled) {
          setAssets(imageData.images || []);
          setPosts(postData.posts || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [router, token]);

  useEffect(() => {
    const editSlug = searchParams.get("edit");
    if (!editSlug || !token || editingSlug === editSlug) return;
    editPost(editSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, token]);

  const modeHelp = useMemo(() => {
    return mode === "moment"
      ? "朋友圈模式适合短文字和多张图片，发布后以动态卡片展示。"
      : "自由图文模式适合长文章、Markdown、代码块和结构化内容。";
  }, [mode]);

  const resetEditor = () => {
    setTitle("");
    setContent("");
    setTags("");
    setCoverImage("");
    setMode("article");
    setStatus("published");
    setImages([]);
    setEditingSlug(null);
  };

  const requireToken = () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      alert("请先登录");
      router.push("/login");
      return null;
    }
    return currentToken;
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    const currentToken = requireToken();
    if (!currentToken) return;

    setUploading(true);
    try {
      const uploaded: ImageAsset[] = [];
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${currentToken}` },
          body: formData,
        });
        const data = (await res.json()) as { image?: ImageAsset; url?: string; error?: string };
        if (!res.ok || !data.url) {
          alert(data.error || "图片上传失败");
          continue;
        }
        if (data.image) uploaded.push(data.image);
      }
      if (uploaded.length > 0) {
        setAssets((current) => [...uploaded, ...current]);
        setImages((current) => Array.from(new Set([...current, ...uploaded.map((item) => item.url)])));
        if (!coverImage) setCoverImage(uploaded[0].url);
      }
    } catch {
      alert("图片上传失败");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const insertImageMarkdown = (url: string) => {
    setImages((current) => Array.from(new Set([...current, url])));
    if (!coverImage) setCoverImage(url);
    if (mode === "article") {
      setContent((current) => `${current}${current.endsWith("\n") || current.length === 0 ? "" : "\n\n"}![图片](${url})\n`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("请填写标题和内容");
      return;
    }
    const currentToken = requireToken();
    if (!currentToken) return;

    setPublishing(true);
    try {
      const endpoint = editingSlug ? `/api/posts/${editingSlug}` : "/api/posts";
      const res = await fetch(endpoint, {
        method: editingSlug ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ title, content, tags, coverImage, status, mode, images }),
      });
      const data = (await res.json()) as { post?: ManagePost; error?: string };
      if (data.post) {
        alert(editingSlug ? "文章已更新" : status === "published" ? "发布成功" : "草稿已保存");
        setPosts((current) => {
          const rest = current.filter((item) => item.slug !== data.post!.slug);
          return [data.post!, ...rest];
        });
        if (status === "published") router.push(`/blog/${data.post.slug}`);
        else resetEditor();
      } else {
        alert(data.error || "保存失败");
      }
    } catch {
      alert("保存失败");
    } finally {
      setPublishing(false);
    }
  };

  const editPost = async (slug: string) => {
    const currentToken = requireToken();
    if (!currentToken) return;
    const res = await fetch(`/api/posts/${slug}`, { headers: { Authorization: `Bearer ${currentToken}` } });
    const data = (await res.json()) as { post?: PostDetail; error?: string };
    if (!data.post) {
      alert(data.error || "读取文章失败");
      return;
    }
    const post = data.post;
    setEditingSlug(post.slug);
    setTitle(post.title);
    setContent(post.content);
    setTags(post.tags || "");
    setCoverImage(post.cover_image || "");
    setMode(post.mode || "article");
    setStatus(post.status);
    try {
      setImages(post.images ? JSON.parse(post.images) : []);
    } catch {
      setImages([]);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deletePost = async (slug: string) => {
    if (!confirm("确定删除这篇文章吗？相关评论也会被删除。")) return;
    const currentToken = requireToken();
    if (!currentToken) return;
    const res = await fetch(`/api/posts/${slug}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    if (res.ok) {
      setPosts((current) => current.filter((post) => post.slug !== slug));
      if (editingSlug === slug) resetEditor();
    } else {
      alert("删除失败");
    }
  };

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-28">
        <PageHeader
          eyebrow="Write"
          title="撰写与管理"
          icon={<Pen size={22} />}
          description="在朋友圈动态和自由图文之间切换，上传图片、保存草稿，并管理自己发布过的内容。"
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <SurfacePanel as="form" onSubmit={handleSubmit} className="space-y-6 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex border border-mist bg-paper/60 p-1">
                {[
                  { value: "article", label: "自由图文", icon: FileText },
                  { value: "moment", label: "朋友圈", icon: Images },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setMode(item.value as PostMode)}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                        mode === item.value ? "bg-cyan-dark text-bronze-light" : "text-ink-light hover:text-cyan-dark"
                      )}
                    >
                      <Icon size={15} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              {editingSlug && (
                <button type="button" onClick={resetEditor} className="btn-outline inline-flex items-center gap-2">
                  <Pen size={15} />
                  新建
                </button>
              )}
            </div>
            <p className="text-sm text-ink-muted">{modeHelp}</p>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-light">
                <FileText size={16} className="text-bronze" />
                标题
              </label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="文章标题..." className="w-full bg-paper/60 text-lg" required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-light">
                  <TagIcon size={16} className="text-bronze" />
                  标签
                </label>
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="旅行, 技术, 生活..." className="w-full bg-paper/60" />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-light">
                  <Image size={16} className="text-bronze" />
                  封面图片 URL
                </label>
                <input type="url" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="可从右侧图片库选择" className="w-full bg-paper/60" />
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-light">
                <Pen size={16} className="text-bronze" />
                内容
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={mode === "moment" ? "今天发生了什么？" : "支持 Markdown 格式..."}
                className={cn("w-full resize-y bg-paper/60 text-sm leading-loose", mode === "article" ? "h-[28rem] font-mono-tech" : "h-56")}
                required
              />
            </div>

            {mode === "moment" && images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                {images.map((url) => (
                  <button key={url} type="button" onClick={() => setImages((current) => current.filter((item) => item !== url))} className="group relative aspect-square overflow-hidden border border-cyan-dark/10 bg-paper-warm">
                    <img src={url} alt="动态图片" className="h-full w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-cinnabar/85 py-1 text-xs text-paper opacity-0 transition-opacity group-hover:opacity-100">移除</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {[
                { value: "published", label: "直接发布", icon: Send },
                { value: "draft", label: "保存草稿", icon: Save },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setStatus(item.value as PostStatus)}
                    className={cn(
                      "inline-flex items-center gap-2 border px-4 py-2 text-sm transition-colors",
                      status === item.value ? "border-cyan-dark bg-cyan-dark text-bronze-light" : "border-mist bg-paper/50 text-ink-light hover:border-cyan-dark/40"
                    )}
                  >
                    <Icon size={15} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <button type="submit" disabled={publishing} className="btn-tech flex w-full items-center justify-center gap-2 disabled:opacity-50">
              <Send size={16} />
              <span>{publishing ? "处理中..." : editingSlug ? "更新文章" : status === "published" ? "发布文章" : "保存草稿"}</span>
              <ArrowRight size={14} />
            </button>
          </SurfacePanel>

          <aside className="space-y-6">
            <SurfacePanel className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-serif-zh text-lg font-semibold tracking-[0.08em]">
                  <Upload size={18} className="text-bronze" />
                  图片库
                </h2>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-outline inline-flex items-center gap-2 px-3 py-2 text-xs disabled:opacity-50">
                  <Upload size={14} />
                  {uploading ? "上传中" : "上传"}
                </button>
                <input type="file" multiple ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              </div>
              {assets.length === 0 ? (
                <p className="text-sm leading-loose text-ink-muted">还没有上传过图片。上传后可设为封面、插入正文或加入朋友圈图片。</p>
              ) : (
                <div className="grid max-h-[34rem] grid-cols-2 gap-3 overflow-y-auto pr-1">
                  {assets.map((asset) => (
                    <div key={asset.id} className="overflow-hidden border border-cyan-dark/10 bg-paper/70">
                      <button type="button" onClick={() => insertImageMarkdown(asset.url)} className="aspect-square w-full overflow-hidden bg-paper-warm">
                        <img src={asset.url} alt={asset.filename} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      </button>
                      <div className="flex gap-1 p-2">
                        <button type="button" onClick={() => setCoverImage(asset.url)} className="flex-1 text-xs text-cyan-dark hover:text-bronze">封面</button>
                        <button type="button" onClick={() => insertImageMarkdown(asset.url)} className="flex-1 text-xs text-cyan-dark hover:text-bronze">插入</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SurfacePanel>

            <SurfacePanel className="p-5">
              <h2 className="mb-4 flex items-center gap-2 font-serif-zh text-lg font-semibold tracking-[0.08em]">
                <LayoutList size={18} className="text-bronze" />
                我的文章
              </h2>
              {loading ? (
                <div className="ink-loading h-1" />
              ) : posts.length === 0 ? (
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
                        <button type="button" onClick={() => editPost(post.slug)} className="inline-flex items-center gap-1 text-xs text-cyan-dark hover:text-bronze">
                          <Pen size={12} />
                          修改
                        </button>
                        <button type="button" onClick={() => deletePost(post.slug)} className="inline-flex items-center gap-1 text-xs text-cinnabar hover:text-cinnabar-dark">
                          <Trash2 size={12} />
                          删除
                        </button>
                        {post.status === "published" && (
                          <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-cyan-dark">
                            <BookOpen size={12} />
                            查看
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SurfacePanel>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}
