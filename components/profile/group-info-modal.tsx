"use client";

import { Info, X } from "lucide-react";
import { SurfacePanel } from "@/components/page-chrome";
import type { UserGroupInfo } from "./types";

const roleDescriptions: Record<string, string> = {
  "*": "拥有全部权限",
  "admin:access": "访问管理员控制台",
  "posts:manage_all": "管理全部文章",
  "posts:create": "发布文章",
  "posts:manage_own": "管理自己的文章",
  "comments:manage_all": "管理全部评论",
  "comments:create": "发表评论",
  "guestbook:manage_all": "管理全部留言",
  "guestbook:create": "发布留言",
  "users:manage": "管理用户与用户名申请",
  "images:upload": "上传图片",
  "images:manage_own": "管理自己的图片",
  "images:manage_all": "管理全部图片",
};

interface GroupRulesPanelProps {
  groups: UserGroupInfo[];
  onSelect: (group: UserGroupInfo) => void;
}

/** 用户组规则面板：列出全部用户组，点击查看权限详情 */
export function GroupRulesPanel({ groups, onSelect }: GroupRulesPanelProps) {
  return (
    <div className="border border-cyan-dark/10 bg-paper/55 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-light">
        <Info size={15} className="text-bronze" />
        用户组规则
      </div>
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <button key={group.name} type="button" onClick={() => onSelect(group)} className="border border-mist bg-paper/70 px-3 py-1.5 text-xs text-ink-light transition-colors hover:border-bronze hover:text-cyan-dark">
            {group.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface GroupInfoModalProps {
  group: UserGroupInfo | null;
  onClose: () => void;
}

/** 权限组详情弹窗：展示用户组权限列表及中文说明 */
export function GroupInfoModal({ group, onClose }: GroupInfoModalProps) {
  if (!group) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/35 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <SurfacePanel className="w-full max-w-lg p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-cyan-dark/70">User Group</div>
            <h2 className="mt-2 font-serif-zh text-2xl font-semibold tracking-[0.08em]">{group.label}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center border border-cyan-dark/10 bg-paper/70 text-ink-muted hover:text-cinnabar" aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          {group.permissions.map((permission) => (
            <div key={permission} className="border border-cyan-dark/10 bg-paper/55 p-3">
              <div className="font-mono-tech text-xs text-cyan-dark">{permission}</div>
              <div className="mt-1 text-sm text-ink-light">{roleDescriptions[permission] || "自定义权限"}</div>
            </div>
          ))}
        </div>
      </SurfacePanel>
    </div>
  );
}
