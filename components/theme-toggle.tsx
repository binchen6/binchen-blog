"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "system" | "light" | "dark";

const THEME_KEY = "theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  if (resolved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    const initial = stored ?? "system";
    setTheme(initial);
    applyTheme(initial);

    // 跟随系统主题变化（仅当前仍是 system 时响应；读 storage 而非闭包，避免覆盖用户后续手动选择）
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const current = (localStorage.getItem(THEME_KEY) as Theme | null) ?? "system";
      if (current === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const updateTheme = (next: Theme) => {
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  };

  const cycle = () => {
    const order: Theme[] = ["system", "light", "dark"];
    const idx = order.indexOf(theme);
    updateTheme(order[(idx + 1) % order.length]);
  };

  const Icon = theme === "system" ? Monitor : theme === "dark" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={cycle}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-md border border-ink-5/60 text-ink-3",
        "transition-colors hover:border-dai/60 hover:text-dai",
        "dark:border-ink-5 dark:text-ink-3 dark:hover:border-dai dark:hover:text-dai"
      )}
      aria-label={`主题: ${theme === "system" ? "跟随系统" : theme === "dark" ? "暗色" : "亮色"}`}
      title={`主题: ${theme === "system" ? "跟随系统" : theme === "dark" ? "暗色" : "亮色"}`}
    >
      <Icon size={16} />
    </button>
  );
}
