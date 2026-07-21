"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "ok" | "error";
type ToastItem = { id: number; message: string; kind: ToastKind };

const TOAST_EVENT = "app-toast";

/** 全局轻提示：toast("发布成功") / toast("失败", "error") */
export function toast(message: string, kind: ToastKind = "ok") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, kind } }));
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; kind: ToastKind }>).detail;
      const id = Date.now() + Math.random();
      setItems((current) => [...current.slice(-2), { id, message: detail.message, kind: detail.kind }]);
      setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 2600);
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 z-[110] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "toast-in pointer-events-auto flex items-center gap-2 border px-4 py-2.5 text-sm shadow-lg backdrop-blur-md",
            item.kind === "ok"
              ? "border-cyan-dark/20 bg-paper/95 text-ink"
              : "border-cinnabar/30 bg-paper/95 text-cinnabar"
          )}
        >
          {item.kind === "ok" ? (
            <CheckCircle2 size={16} className="shrink-0 text-cyan-dark" />
          ) : (
            <XCircle size={16} className="shrink-0" />
          )}
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  );
}
