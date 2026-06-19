"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { Compass, SearchX } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { cn } from "@/lib/utils";

type SiteShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  withFooter?: boolean;
  compactDecor?: boolean;
};

export function SiteShell({
  children,
  className,
  contentClassName,
  withFooter = true,
  compactDecor = false,
}: SiteShellProps) {
  return (
    <main className={cn("min-h-screen relative overflow-hidden bg-paper text-ink", className)}>
      <Navigation />
      <div className="site-bg" aria-hidden="true">
        <div className="site-bg__paper" />
        <div className="site-bg__stars" />
        <div className="site-bg__compass" />
        <div className="site-bg__gear" />
        {!compactDecor && <div className="site-bg__wash" />}
      </div>
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
      {withFooter && <Footer />}
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

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  align = "center",
  className,
}: PageHeaderProps) {
  const isCenter = align === "center";

  return (
    <header className={cn(isCenter ? "text-center" : "text-left", className)}>
      <div className={cn("mb-4 flex", isCenter ? "justify-center" : "justify-start")}>
        <span className="inline-flex h-11 w-11 items-center justify-center border border-bronze/35 bg-paper/75 text-bronze shadow-sm">
          {icon ?? <Compass size={22} />}
        </span>
      </div>
      <span className="mb-2 block font-mono-tech text-xs uppercase tracking-[0.18em] text-cyan-dark/70">
        {eyebrow}
      </span>
      <h1 className="font-serif-zh text-3xl font-bold tracking-[0.12em] text-ink md:text-5xl">
        {title}
      </h1>
      {description && (
        <p className={cn("mt-5 text-sm leading-loose text-ink-light md:text-base", isCenter && "mx-auto max-w-2xl")}>
          {description}
        </p>
      )}
      <div
        className={cn(
          "mt-6 h-px w-20 bg-gradient-to-r from-transparent via-bronze to-transparent",
          isCenter && "mx-auto"
        )}
      />
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
    <SurfacePanel className="mx-auto max-w-md px-8 py-12 text-center">
      <SearchX size={30} className="mx-auto mb-4 text-bronze" />
      <h2 className="font-serif-zh text-xl font-semibold tracking-[0.08em]">{title}</h2>
      {description && <p className="mt-3 text-sm leading-loose text-ink-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </SurfacePanel>
  );
}
