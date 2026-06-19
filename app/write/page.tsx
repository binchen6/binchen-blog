"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Image, Pen, Send, Tag as TagIcon, Upload } from "lucide-react";
import { PageHeader, SiteShell, SurfacePanel } from "@/components/page-chrome";
import { cn } from "@/lib/utils";

export default function WritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("请先登录");
        router.push("/login");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        setCoverImage(data.url);
      } else {
        alert(data.error || "图片上传失败");
      }
    } catch {
      alert("图片上传失败");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("请填写标题和内容");
      return;
    }
    setPublishing(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("请先登录");
        router.push("/login");
        return;
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, tags, coverImage, status }),
      });
      const data = (await res.json()) as { post?: { slug: string }; error?: string };
      if (data.post) {
        alert(status === "published" ? "发布成功" : "草稿已保存");
        router.push(`/blog/${data.post.slug}`);
      } else {
        alert(data.error || "发布失败");
      }
    } catch {
      alert("发布失败");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SiteShell>
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-28">
        <PageHeader
          eyebrow="Write"
          title="撰写文章"
          icon={<Pen size={22} />}
          description="支持 Markdown、封面图上传和草稿保存。图片会上传到 GitHub 仓库，并通过 jsDelivr 加速访问。"
        />

        <SurfacePanel as="form" onSubmit={handleSubmit} className="mt-12 space-y-6 p-6 md:p-8">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-light">
              <FileText size={16} className="text-bronze" />
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="文章标题..."
              className="w-full bg-paper/60 text-lg"
              required
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-light">
              <TagIcon size={16} className="text-bronze" />
              标签
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="旅行, 技术, 生活..."
              className="w-full bg-paper/60"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-light">
              <Image size={16} className="text-bronze" />
              封面图片
            </label>
            <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-outline inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Upload size={16} />
                <span>{uploading ? "上传中..." : "上传图片"}</span>
              </button>
              {coverImage ? (
                <div className="flex items-center gap-4">
                  <div className="aspect-video w-36 overflow-hidden border border-cyan-dark/10 bg-paper-warm">
                    <img src={coverImage} alt="封面预览" className="h-full w-full object-cover" />
                  </div>
                  <span className="truncate text-xs text-ink-muted">{coverImage}</span>
                </div>
              ) : (
                <p className="text-sm text-ink-muted">未选择封面图</p>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-light">
              <Pen size={16} className="text-bronze" />
              内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="支持 Markdown 格式..."
              className="h-[28rem] w-full resize-y bg-paper/60 font-mono-tech text-sm leading-loose"
              required
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { value: "published", label: "直接发布" },
              { value: "draft", label: "保存草稿" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStatus(item.value as "published" | "draft")}
                className={cn(
                  "border px-4 py-2 text-sm transition-colors",
                  status === item.value ? "border-cyan-dark bg-cyan-dark text-bronze-light" : "border-mist bg-paper/50 text-ink-light hover:border-cyan-dark/40"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button type="submit" disabled={publishing} className="btn-tech flex w-full items-center justify-center gap-2 disabled:opacity-50">
            <Send size={16} />
            <span>{publishing ? "处理中..." : status === "published" ? "发布文章" : "保存草稿"}</span>
            <ArrowRight size={14} />
          </button>
        </SurfacePanel>
      </section>
    </SiteShell>
  );
}
