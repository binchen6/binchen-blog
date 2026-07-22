"use client";

import { Image, Trash2 } from "lucide-react";
import { SurfacePanel } from "@/components/page-chrome";
import { toast } from "@/components/toast";
import type { ImageRow } from "./types";

export function ImagesPanel({
  images,
  setImages,
  authHeaders,
}: {
  images: ImageRow[];
  setImages: React.Dispatch<React.SetStateAction<ImageRow[]>>;
  authHeaders: Record<string, string>;
}) {
  const deleteImage = async (id: number) => {
    try {
      const res = await fetch(`/api/images/${id}`, { method: "DELETE", headers: authHeaders });
      if (res.ok) setImages((current) => current.filter((image) => image.id !== id));
      else toast("删除图片失败", "error");
    } catch {
      toast("网络异常，删除图片失败", "error");
    }
  };

  return (
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
  );
}
