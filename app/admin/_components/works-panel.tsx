"use client";

import { useState } from "react";
import { Pencil, Plus, Sparkles, Star, Trash2, Upload } from "lucide-react";
import { SurfacePanel } from "@/components/page-chrome";
import { toast } from "@/components/toast";
import { DEFAULT_WORKS } from "@/lib/works-defaults";
import type { WorkRow } from "./types";

type WorkForm = {
  title: string;
  badge: string;
  year: string;
  description: string;
  tags: string;
  href: string;
  external: boolean;
  cta: string;
  icon: string;
  accent: string;
  cover: string;
  repo: string;
  featured: boolean;
  sort_order: number;
  visible: boolean;
};

const EMPTY_FORM: WorkForm = {
  title: "",
  badge: "",
  year: "",
  description: "",
  tags: "",
  href: "",
  external: false,
  cta: "",
  icon: "sparkles",
  accent: "dai",
  cover: "",
  repo: "",
  featured: false,
  sort_order: 0,
  visible: true,
};

function rowToForm(row: WorkRow): WorkForm {
  return {
    title: row.title,
    badge: row.badge,
    year: row.year,
    description: row.description,
    tags: row.tags,
    href: row.href,
    external: row.external === 1,
    cta: row.cta,
    icon: row.icon,
    accent: row.accent,
    cover: row.cover,
    repo: row.repo,
    featured: row.featured === 1,
    sort_order: row.sort_order,
    visible: row.visible === 1,
  };
}

const ICON_OPTIONS = ["sparkles", "compass", "globe", "gamepad", "mouse", "hammer", "rocket", "book"];
const ACCENT_OPTIONS = ["dai", "gold", "cinnabar", "ink"];

function WorkFormFields({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: {
  form: WorkForm;
  setForm: (f: WorkForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const set = (patch: Partial<WorkForm>) => setForm({ ...form, ...patch });
  const inputCls = "w-full bg-paper/60";
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs text-ink-muted">标题 *</span>
          <input type="text" value={form.title} onChange={(e) => set({ title: e.target.value })} className={inputCls} maxLength={80} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-muted">徽标（如 Flagship / 地理专题）</span>
          <input type="text" value={form.badge} onChange={(e) => set({ badge: e.target.value })} className={inputCls} maxLength={40} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-muted">年份</span>
          <input type="text" value={form.year} onChange={(e) => set({ year: e.target.value })} className={inputCls} maxLength={40} placeholder="2026" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs text-ink-muted">描述</span>
        <textarea value={form.description} onChange={(e) => set({ description: e.target.value })} className="h-20 w-full resize-none bg-paper/60" maxLength={1000} />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs text-ink-muted">链接（站内 /works 或完整 URL）</span>
          <input type="text" value={form.href} onChange={(e) => set({ href: e.target.value })} className={inputCls} maxLength={300} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-muted">按钮文字</span>
          <input type="text" value={form.cta} onChange={(e) => set({ cta: e.target.value })} className={inputCls} maxLength={40} placeholder="进入页面 / GitHub 仓库" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-muted">GitHub 仓库地址（可选）</span>
          <input type="text" value={form.repo} onChange={(e) => set({ repo: e.target.value })} className={inputCls} maxLength={300} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-muted">封面图 URL（可选，小图展示）</span>
          <input type="text" value={form.cover} onChange={(e) => set({ cover: e.target.value })} className={inputCls} maxLength={300} placeholder="/assets/works/xxx.webp" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-muted">标签（逗号分隔）</span>
          <input type="text" value={form.tags} onChange={(e) => set({ tags: e.target.value })} className={inputCls} maxLength={300} placeholder="Electron,TypeScript" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-muted">排序（小的在前）</span>
          <input type="number" value={form.sort_order} onChange={(e) => set({ sort_order: Number(e.target.value) || 0 })} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-muted">图标</span>
          <select value={form.icon} onChange={(e) => set({ icon: e.target.value })} className={inputCls}>
            {ICON_OPTIONS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
            <option value="/CryoClaw/assets/icon.png">/CryoClaw/assets/icon.png（图片路径）</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-muted">配色</span>
          <select value={form.accent} onChange={(e) => set({ accent: e.target.value })} className={inputCls}>
            {ACCENT_OPTIONS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-6 text-sm text-ink-light">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} />
          旗舰（大卡片展示）
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={form.external} onChange={(e) => set({ external: e.target.checked })} />
          外链（新窗口打开）
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={form.visible} onChange={(e) => set({ visible: e.target.checked })} />
          可见
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="btn-tech inline-flex items-center gap-2 disabled:opacity-50">
          <Plus size={16} />
          {submitting ? "提交中..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-outline">
            取消
          </button>
        )}
      </div>
    </form>
  );
}

export function WorksPanel({
  works,
  setWorks,
  authHeaders,
}: {
  works: WorkRow[];
  setWorks: React.Dispatch<React.SetStateAction<WorkRow[]>>;
  authHeaders: Record<string, string>;
}) {
  const [form, setForm] = useState<WorkForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<WorkForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const jsonHeaders = { "Content-Type": "application/json", ...authHeaders };

  const createWork = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/works", { method: "POST", headers: jsonHeaders, body: JSON.stringify(form) });
      const data = (await res.json()) as { work?: WorkRow; error?: string };
      if (!res.ok || !data.work) {
        toast(data.error || "新增失败", "error");
        return;
      }
      setWorks((current) => [...current, data.work!]);
      setForm(EMPTY_FORM);
      toast("作品已添加");
    } catch {
      toast("网络异常，新增失败", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const updateWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId === null) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/works?id=${editingId}`, { method: "PUT", headers: jsonHeaders, body: JSON.stringify(editForm) });
      const data = (await res.json()) as { work?: WorkRow; error?: string };
      if (!res.ok || !data.work) {
        toast(data.error || "保存失败", "error");
        return;
      }
      setWorks((current) => current.map((item) => (item.id === editingId ? data.work! : item)));
      setEditingId(null);
      toast("已保存");
    } catch {
      toast("网络异常，保存失败", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteWork = async (id: number) => {
    if (!confirm("确定删除这个作品吗？")) return;
    try {
      const res = await fetch(`/api/works?id=${id}`, { method: "DELETE", headers: authHeaders });
      if (res.ok) setWorks((current) => current.filter((item) => item.id !== id));
      else toast("删除失败", "error");
    } catch {
      toast("网络异常，删除失败", "error");
    }
  };

  const toggleVisible = async (row: WorkRow) => {
    try {
      const res = await fetch(`/api/works?id=${row.id}`, {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ ...rowToForm(row), visible: row.visible !== 1 }),
      });
      const data = (await res.json()) as { work?: WorkRow };
      if (res.ok && data.work) setWorks((current) => current.map((item) => (item.id === row.id ? data.work! : item)));
    } catch {
      toast("网络异常", "error");
    }
  };

  const seedDefaults = async () => {
    if (!confirm("将写入 5 件默认作品（CryoClaw、地理专题、博客、第七频率、连点器）。继续？")) return;
    setSeeding(true);
    try {
      for (const item of DEFAULT_WORKS) {
        const { id: _id, ...payload } = item;
        const res = await fetch("/api/works", {
          method: "POST",
          headers: jsonHeaders,
          body: JSON.stringify({ ...payload, external: payload.external === 1, featured: payload.featured === 1, visible: true }),
        });
        const data = (await res.json()) as { work?: WorkRow };
        if (res.ok && data.work) setWorks((current) => [...current, data.work!]);
      }
      toast("默认作品已写入");
    } catch {
      toast("网络异常，写入中断", "error");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      <SurfacePanel className="p-6">
        <h2 className="mb-1 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
          <Sparkles size={20} className="text-bronze" />
          新增作品
        </h2>
        <p className="mb-5 text-sm text-ink-muted">作品页与首页的作品区实时读取这里的数据；徽标为 Flagship 的条目以旗舰大卡展示。</p>
        <WorkFormFields form={form} setForm={setForm} onSubmit={createWork} submitting={submitting} submitLabel="添加作品" />
      </SurfacePanel>

      <SurfacePanel className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
            <Sparkles size={20} className="text-bronze" />
            作品列表（{works.length}）
          </h2>
          {works.length === 0 && (
            <button type="button" onClick={seedDefaults} disabled={seeding} className="btn-outline inline-flex items-center gap-2 disabled:opacity-50">
              <Upload size={15} />
              {seeding ? "写入中..." : "载入默认作品"}
            </button>
          )}
        </div>
        {works.length === 0 ? (
          <p className="text-sm text-ink-muted">还没有作品数据。点右上角「载入默认作品」一键写入，或手动新增。</p>
        ) : (
          <div className="space-y-3">
            {works.map((item) => (
              <div key={item.id} className="border border-cyan-dark/10 bg-paper/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {item.featured === 1 && <Star size={14} className="shrink-0 text-gold" />}
                    <span className="truncate font-semibold">{item.title}</span>
                    <span className="shrink-0 font-mono-tech text-xs text-ink-muted">{item.badge}</span>
                    {item.visible !== 1 && <span className="shrink-0 text-xs text-cinnabar">（隐藏）</span>}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button type="button" onClick={() => toggleVisible(item)} className="text-xs text-ink-muted transition-colors hover:text-dai">
                      {item.visible === 1 ? "隐藏" : "显示"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(editingId === item.id ? null : item.id);
                        setEditForm(rowToForm(item));
                      }}
                      className="text-ink-muted transition-colors hover:text-dai"
                      aria-label="编辑作品"
                    >
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => deleteWork(item.id)} className="text-cinnabar transition-colors hover:text-cinnabar-dark" aria-label="删除作品">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {item.description && <p className="mt-2 line-clamp-2 text-sm leading-loose text-ink-light">{item.description}</p>}
                {editingId === item.id && (
                  <div className="mt-4 border-t border-cyan-dark/10 pt-4">
                    <WorkFormFields form={editForm} setForm={setEditForm} onSubmit={updateWork} onCancel={() => setEditingId(null)} submitting={submitting} submitLabel="保存修改" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SurfacePanel>
    </div>
  );
}
