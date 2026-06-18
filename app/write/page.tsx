"use client";

import { useState, useRef, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Upload, Send, Image, Tag as TagIcon, FileText } from "lucide-react";

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
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) setCoverImage(data.url);
    } catch (error) {
      console.error("Upload error:", error);
      alert("图片上传失败");
    } finally {
      setUploading(false);
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
      const data = await res.json();
      if (data.post) {
        alert("发布成功！");
        router.push(`/blog/${data.post.slug}`);
      } else {
        alert(data.error || "发布失败");
      }
    } catch (error) {
      console.error("Publish error:", error);
      alert("发布失败");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper">
      <Navigation />
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center mb-12">
              <span className="text-xs text-stone tracking-widest uppercase mb-2 block">Write</span>
              <h1 className="font-serif-zh text-3xl md:text-4xl font-bold tracking-wider">撰写文章</h1>
              <div className="w-16 h-px bg-ink/10 mx-auto mt-4" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold mb-2">
                  <FileText size={16} />
                  <span>标题</span>
                </label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="文章标题..." className="w-full text-lg" required />
              </div>
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold mb-2">
                  <TagIcon size={16} />
                  <span>标签</span>
                </label>
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="旅行, 摄影, 生活...（用逗号分隔）" className="w-full" />
              </div>
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold mb-2">
                  <Image size={16} />
                  <span>封面图片</span>
                </label>
                <div className="flex items-center space-x-4">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-outline flex items-center space-x-2" disabled={uploading}>
                    <Upload size={16} />
                    <span>{uploading ? "上传中..." : "上传图片"}</span>
                  </button>
                  {coverImage && (
                    <div className="relative">
                      <img src={coverImage} alt="Cover" className="h-16 w-24 object-cover rounded" />
                      <button type="button" onClick={() => setCoverImage("")} className="absolute -top-2 -right-2 w-5 h-5 bg-cinnabar text-white rounded-full text-xs flex items-center justify-center">×</button>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold mb-2">
                  <FileText size={16} />
                  <span>内容</span>
                </label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="支持 Markdown 格式..." className="w-full h-96 resize-none font-mono text-sm" required />
                <p className="text-xs text-stone mt-1">支持 Markdown 语法。当前字数: {content.length}</p>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input type="radio" value="published" checked={status === "published"} onChange={() => setStatus("published")} className="accent-ink" />
                  <span className="text-sm">立即发布</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" value="draft" checked={status === "draft"} onChange={() => setStatus("draft")} className="accent-ink" />
                  <span className="text-sm">保存草稿</span>
                </label>
              </div>
              <div className="flex items-center space-x-4 pt-4">
                <button type="submit" disabled={publishing} className="btn-ink flex items-center space-x-2 disabled:opacity-50">
                  <Send size={16} />
                  <span>{publishing ? "发布中..." : "发布文章"}</span>
                </button>
                <button type="button" onClick={() => router.push("/blog")} className="btn-outline">取消</button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
