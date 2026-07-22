"use client";

import { Copy, Image, Trash2 } from "lucide-react";
import { SurfacePanel } from "@/components/page-chrome";
import { toast } from "@/components/toast";
import type { ImageAsset } from "./types";

interface MyImagesProps {
  images: ImageAsset[];
  authHeaders: Record<string, string>;
  onDeleted: (id: number) => void;
}

/** 我的图片墙：点击预览原图，支持复制链接与删除 */
export function MyImages({ images, authHeaders, onDeleted }: MyImagesProps) {
  const copyImageUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast("图片链接已复制");
  };

  const deleteImage = async (id: number) => {
    if (!confirm("确定删除这张图片吗？")) return;
    const res = await fetch(`/api/images/${id}`, { method: "DELETE", headers: authHeaders });
    if (res.ok) onDeleted(id);
    else toast("删除图片失败", "error");
  };

  return (
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
  );
}
