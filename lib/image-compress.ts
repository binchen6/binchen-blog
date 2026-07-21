"use client";

/**
 * 客户端图片压缩：大图转 WebP，减小上传体积。
 * 头像走 compressAvatarFile（中心方形裁剪）。
 */

const IMAGE_COMPRESSION_THRESHOLD_BYTES = 2 * 1024 * 1024;
const IMAGE_COMPRESSION_MAX_EDGE = 2560;
const IMAGE_COMPRESSION_QUALITY = 0.82;

const AVATAR_SIZE = 512;
const AVATAR_QUALITY = 0.85;

function renameAsWebp(filename: string): string {
  return filename.replace(/\.[^.]+$/, "") + ".webp";
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImageFile(file: File): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const maxEdge = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, IMAGE_COMPRESSION_MAX_EDGE / maxEdge);
    if (file.size <= IMAGE_COMPRESSION_THRESHOLD_BYTES && scale >= 1) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToBlob(canvas, "image/webp", IMAGE_COMPRESSION_QUALITY);
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], renameAsWebp(file.name), {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}

/** 头像压缩：中心方形裁剪 + 缩放到 512px WebP */
export async function compressAvatarFile(file: File): Promise<File> {
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = Math.round((bitmap.width - side) / 2);
    const sy = Math.round((bitmap.height - side) / 2);

    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
    const blob = await canvasToBlob(canvas, "image/webp", AVATAR_QUALITY);
    if (!blob) return file;

    return new File([blob], renameAsWebp(file.name || "avatar"), {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}
