"use client";

import { BarChart3 } from "lucide-react";
import { SurfacePanel } from "@/components/page-chrome";
import type { PerformanceTaskRow, PerformanceRunRow } from "./types";

export function PerformancePanel({
  tasks,
  runs,
}: {
  tasks: PerformanceTaskRow[];
  runs: PerformanceRunRow[];
}) {
  return (
    <div className="space-y-6">
      <SurfacePanel className="p-6">
        <h2 className="mb-5 flex items-center gap-2 font-serif-zh text-xl font-semibold tracking-[0.08em]">
          <BarChart3 size={20} className="text-bronze" />
          服务端性能调度
        </h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-ink-muted">暂无调度记录。部署后配置 CRON_SECRET，并定时 POST /api/cron/performance 即可开始记录。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-cyan-dark/10 text-ink-muted">
                <tr>
                  <th className="py-3">任务</th>
                  <th>说明</th>
                  <th>7 日运行</th>
                  <th>失败</th>
                  <th>平均耗时</th>
                  <th>最大耗时</th>
                  <th>最近失败</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.task} className="border-b border-cyan-dark/5">
                    <td className="py-3 font-mono-tech text-xs text-cyan-dark">{task.task}</td>
                    <td className="max-w-[220px] text-xs text-ink-muted">{task.description || "—"}</td>
                    <td>{task.runs}</td>
                    <td className={task.failures > 0 ? "font-semibold text-cinnabar" : ""}>{task.failures}</td>
                    <td>{Math.round(Number(task.avg_duration_ms || 0))}ms</td>
                    <td>{Math.round(Number(task.max_duration_ms || 0))}ms</td>
                    <td className="font-mono-tech text-xs text-ink-muted">{task.last_failed_at || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SurfacePanel>

      <SurfacePanel className="p-6">
        <h3 className="mb-4 flex items-center gap-2 font-serif-zh text-lg font-semibold tracking-[0.08em]">
          <BarChart3 size={18} className="text-bronze" />
          最近调度运行
        </h3>
        {runs.length === 0 ? (
          <p className="text-sm text-ink-muted">暂无运行记录。</p>
        ) : (
          <div className="divide-y divide-mist/60">
            {runs.map((run) => (
              <div key={run.run_id || run.created_at} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm">
                <span className={`inline-flex w-14 justify-center border px-1.5 py-0.5 text-[10px] tracking-wider ${
                  run.status === "ok" ? "border-dai/40 text-dai" : "border-cinnabar/50 text-cinnabar"
                }`}>
                  {run.status === "ok" ? "成功" : "异常"}
                </span>
                <span className="font-mono-tech text-xs text-ink-muted">{run.created_at}</span>
                <span className="text-xs text-ink-light">耗时 {run.duration_ms}ms</span>
                <span className="text-xs text-ink-muted">{run.detailsText}</span>
              </div>
            ))}
          </div>
        )}
      </SurfacePanel>
    </div>
  );
}
