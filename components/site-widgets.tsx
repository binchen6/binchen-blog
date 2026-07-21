"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** 回到顶部：滚动超过一屏后浮现 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="回到顶部"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-8 right-6 z-40 grid h-11 w-11 place-items-center border border-bronze/40 bg-paper/90 text-bronze shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-bronze hover:text-paper",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <ArrowUp size={18} />
    </button>
  );
}

/** 文章阅读进度条（吸附导航顶部） */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, window.scrollY / total) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return <div className="reading-progress" style={{ width: `${progress * 100}%` }} aria-hidden="true" />;
}

/** 文章卡片骨架屏 */
export function PostCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="paper-card flex h-full flex-col">
          <div className="skeleton aspect-[16/10] rounded-none" />
          <div className="flex flex-1 flex-col gap-4 p-6">
            <div className="skeleton h-3 w-2/5" />
            <div className="skeleton h-5 w-4/5" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
