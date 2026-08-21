"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { Compass } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { BackToTop } from "@/components/site-widgets";
import { ToastHost } from "@/components/toast";
import { AnnouncementCenter } from "@/components/announcement-center";
import { cn } from "@/lib/utils";

type SiteShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  withFooter?: boolean;
  compactDecor?: boolean;
};

/**
 * 墨卷 2.0 页面骨架：干净宣纸底 + 角落墨晕点缀（克制，不铺满）
 */
export function SiteShell({ children, className, contentClassName, withFooter = true, compactDecor = false }: SiteShellProps) {
  return (
    <main className={cn("min-h-screen relative overflow-hidden bg-paper text-ink has-tab-bar", className)}>
      <Navigation />
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
      {withFooter && <Footer />}
      <BackToTop />
      <ToastHost />
      <AnnouncementCenter />
    </main>
  );
}

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  align?: "center" | "left";
  className?: string;
};

export function PageHeader({ eyebrow, title, description, icon, align = "center", className }: PageHeaderProps) {
  const isCenter = align === "center";

  return (
    <header className={cn(isCenter ? "text-center" : "text-left", className)}>
      <div className={cn("mb-4 flex", isCenter ? "justify-center" : "justify-start")}>
        <span className="inline-flex h-11 w-11 items-center justify-center border border-gold/35 bg-paper/75 text-gold shadow-sm">
          {icon ?? <Compass size={22} />}
        </span>
      </div>
      <span className="mb-2 block font-mono-tech text-xs uppercase tracking-[0.18em] text-dai/70">
        {eyebrow}
      </span>
      <h1 className="font-serif-zh text-3xl font-bold tracking-[0.12em] text-ink md:text-5xl">
        {title}
      </h1>
      {description && (
        <p className={cn("mt-5 text-sm leading-loose text-ink-2 md:text-base", isCenter && "mx-auto max-w-2xl")}>
          {description}
        </p>
      )}
      <div aria-hidden="true" className={cn("section-rule mt-7", !isCenter && "!ml-0")} />
    </header>
  );
}

type SurfacePanelProps<T extends ElementType = "div"> = {
  children: ReactNode;
  className?: string;
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function SurfacePanel<T extends ElementType = "div">({ children, className, as, ...props }: SurfacePanelProps<T>) {
  const Component = as || "div";
  return (
    <Component className={cn("surface-panel", className)} {...props}>
      {children}
    </Component>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-8 py-10 text-center">
      <img src="/assets/ink/empty-boat.webp" alt="" aria-hidden="true" loading="lazy" decoding="async" className="mx-auto mb-5 w-52 mix-blend-multiply opacity-80" />
      <h2 className="font-serif-zh text-xl font-semibold tracking-[0.08em] text-ink-2">{title}</h2>
      {description && <p className="mt-3 text-sm leading-loose text-ink-3">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
