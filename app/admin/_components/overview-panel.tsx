"use client";

import type { LucideIcon } from "lucide-react";
import { BookOpen, HardDrive, Image, MessageCircle, Shield, UserCog } from "lucide-react";
import { SurfacePanel } from "@/components/page-chrome";
import type { GithubStorageStatus } from "./types";

type StatCard = [string, number | undefined, LucideIcon];

export function OverviewPanel({
  stats,
  githubStorage,
}: {
  stats: Record<string, number>;
  githubStorage: GithubStorageStatus | null;
}) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-6">
        {([
          ["用户", stats.users, UserCog],
          ["待审", stats.usernameRequests, Shield],
          ["文章", stats.posts, BookOpen],
          ["评论", stats.comments, MessageCircle],
          ["留言", stats.guestbook, MessageCircle],
          ["图片", stats.images, Image],
        ] as StatCard[]).map(([label, value, Icon]) => (
          <SurfacePanel key={String(label)} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-muted">{String(label)}</span>
              <Icon size={18} className="text-bronze" />
            </div>
            <div className="mt-3 font-mono-tech text-3xl text-cyan-dark">{Number(value || 0)}</div>
          </SurfacePanel>
        ))}
      </div>

      <SurfacePanel className="p-6">
        <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
          <HardDrive size={20} className="text-bronze" />
          GitHub 图片存储
        </h2>
        {!githubStorage ? (
          <p className="text-sm text-ink-muted">暂未读取到存储检查结果。</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
            <div className="border border-cyan-dark/10 bg-paper/55 p-4">
              <div className="text-sm text-ink-muted">配置状态</div>
              <div className={githubStorage.configured && githubStorage.repoCheck.ok ? "mt-2 text-lg font-semibold text-cyan-dark" : "mt-2 text-lg font-semibold text-cinnabar"}>
                {githubStorage.configured && githubStorage.repoCheck.ok ? "可用" : "需要处理"}
              </div>
              <div className="mt-3 text-sm text-ink-light">
                {githubStorage.configured
                  ? `已读取 ${githubStorage.owner || "-"} / ${githubStorage.repo || "-"}`
                  : `缺少：${githubStorage.missing.join(", ") || "未知变量"}`}
              </div>
            </div>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div className="border border-cyan-dark/10 bg-paper/55 p-4">
                <div className="text-ink-muted">分支 / 目录</div>
                <div className="mt-2 font-mono-tech text-xs text-cyan-dark">{githubStorage.branch} / {githubStorage.uploadDir}</div>
              </div>
              <div className="border border-cyan-dark/10 bg-paper/55 p-4">
                <div className="text-ink-muted">Token</div>
                <div className="mt-2 font-mono-tech text-xs text-cyan-dark">
                  {githubStorage.tokenPresent ? `已读取，长度 ${githubStorage.tokenLength}` : "未读取"}
                </div>
              </div>
              <div className="border border-cyan-dark/10 bg-paper/55 p-4 md:col-span-2">
                <div className="text-ink-muted">仓库权限检查</div>
                <div className="mt-2 font-mono-tech text-xs text-cyan-dark">
                  {githubStorage.repoCheck.status ? `GitHub 返回 ${githubStorage.repoCheck.status}` : "未执行"}
                </div>
                {githubStorage.repoCheck.message && (
                  <div className="mt-2 text-xs text-cinnabar">{githubStorage.repoCheck.message}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </SurfacePanel>
    </div>
  );
}
