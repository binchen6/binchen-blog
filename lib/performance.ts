import { cleanupRateLimitBuckets } from "./security";

export type PerformanceTaskResult = {
  task: string;
  status: "ok" | "error";
  durationMs: number;
  details: Record<string, unknown>;
};

export type PerformanceRun = {
  runId: string;
  startedAt: string;
  totalDurationMs: number;
  results: PerformanceTaskResult[];
};

type PerformanceTask = {
  name: string;
  description: string;
  timeoutMs: number;
  handler: (db: any) => Promise<Record<string, unknown>> | Record<string, unknown>;
};

/** 单次调度运行的汇总事件 task 名（用于"最近运行"查询） */
const RUN_SUMMARY_TASK = "__run__";

/** 任务注册表：新增调度任务只需在此加一项 */
const TASKS: PerformanceTask[] = [
  {
    name: "rate-limit-cleanup",
    description: "清理过期的内存限流桶",
    timeoutMs: 5_000,
    handler: () => ({
      removedBuckets: cleanupRateLimitBuckets(),
    }),
  },
  {
    name: "database-health",
    description: "核心表行数快照",
    timeoutMs: 10_000,
    handler: async (db) => {
      const [users, posts, comments, guestbook, images] = await Promise.all([
        db.prepare("SELECT COUNT(*) AS count FROM users").first(),
        db.prepare("SELECT COUNT(*) AS count FROM posts").first(),
        db.prepare("SELECT COUNT(*) AS count FROM comments").first(),
        db.prepare("SELECT COUNT(*) AS count FROM guestbook").first(),
        db.prepare("SELECT COUNT(*) AS count FROM images").first(),
      ]);
      return {
        users: Number(users?.count || 0),
        posts: Number(posts?.count || 0),
        comments: Number(comments?.count || 0),
        guestbook: Number(guestbook?.count || 0),
        images: Number(images?.count || 0),
      };
    },
  },
  {
    name: "database-optimize",
    description: "PRAGMA optimize 索引优化",
    timeoutMs: 15_000,
    handler: async (db: D1Database) => {
      await db.prepare("PRAGMA optimize").run();
      return { optimized: true };
    },
  },
  {
    name: "retention-cleanup",
    description: "清理 90 天前的改名申请 / 30 天前的性能事件",
    timeoutMs: 20_000,
    handler: async (db: D1Database) => {
      const staleDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const oldPerfDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const rejected = await db.prepare(
        "DELETE FROM username_change_requests WHERE status IN ('approved', 'rejected') AND created_at < ?"
      ).bind(staleDate).run();
      const perf = await db.prepare("DELETE FROM performance_events WHERE created_at < ?").bind(oldPerfDate).run();
      return {
        usernameRequestsDeleted: rejected.meta?.changes || 0,
        performanceEventsDeleted: perf.meta?.changes || 0,
      };
    },
  },
];

export const TASK_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  TASKS.map((t) => [t.name, t.description])
);

async function recordEvent(db: D1Database, runId: string, result: PerformanceTaskResult) {
  await db.prepare(
    "INSERT INTO performance_events (run_id, task, status, duration_ms, details) VALUES (?, ?, ?, ?, ?)"
  ).bind(runId, result.task, result.status, result.durationMs, JSON.stringify(result.details)).run();
}

function withTimeout<T>(p: Promise<T> | T, ms: number): Promise<T> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)),
  ]);
}

async function runTask(db: D1Database, runId: string, task: PerformanceTask): Promise<PerformanceTaskResult> {
  const started = Date.now();
  let result: PerformanceTaskResult;
  try {
    const details = await withTimeout(task.handler(db), task.timeoutMs);
    result = { task: task.name, status: "ok", durationMs: Date.now() - started, details };
  } catch (error) {
    result = {
      task: task.name,
      status: "error",
      durationMs: Date.now() - started,
      details: { message: error instanceof Error ? error.message : "Unknown error" },
    };
  }
  await recordEvent(db, runId, result);
  return result;
}

export async function runPerformanceSchedule(db: D1Database): Promise<PerformanceRun> {
  const runId = crypto.randomUUID();
  const started = Date.now();
  const results: PerformanceTaskResult[] = [];

  for (const task of TASKS) {
    results.push(await runTask(db, runId, task));
  }

  const failures = results.filter((r) => r.status === "error").length;
  const summary: PerformanceTaskResult = {
    task: RUN_SUMMARY_TASK,
    status: failures > 0 ? "error" : "ok",
    durationMs: Date.now() - started,
    details: { tasks: results.length, failures },
  };
  await recordEvent(db, runId, summary);

  return {
    runId,
    startedAt: new Date(started).toISOString(),
    totalDurationMs: summary.durationMs,
    results,
  };
}

export async function getPerformanceSummary(db: D1Database) {
  const [taskStats, recentRuns, recentErrors] = await Promise.all([
    // 每个任务近 7 日统计（含失败数与最近失败时间）
    db.prepare(
      `SELECT task,
              COUNT(*) AS runs,
              SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS failures,
              AVG(duration_ms) AS avg_duration_ms,
              MAX(duration_ms) AS max_duration_ms,
              MAX(CASE WHEN status = 'error' THEN created_at END) AS last_failed_at
       FROM performance_events
       WHERE task != '${RUN_SUMMARY_TASK}' AND created_at > datetime('now', '-7 days')
       GROUP BY task
       ORDER BY max_duration_ms DESC`
    ).all<{
      task: string;
      runs: number;
      failures: number;
      avg_duration_ms: number;
      max_duration_ms: number;
      last_failed_at: string | null;
    }>(),
    // 最近 20 次调度运行（每次运行一条 __run__ 汇总事件）
    db.prepare(
      `SELECT run_id, status, duration_ms, details, created_at
       FROM performance_events
       WHERE task = '${RUN_SUMMARY_TASK}'
       ORDER BY created_at DESC
       LIMIT 20`
    ).all(),
    // 最近 10 条任务级错误
    db.prepare(
      `SELECT run_id, task, duration_ms, details, created_at
       FROM performance_events
       WHERE status = 'error' AND task != '${RUN_SUMMARY_TASK}'
       ORDER BY created_at DESC
       LIMIT 10`
    ).all(),
  ]);

  const runs = recentRuns.results || [];
  return {
    latestRun: runs[0] || null,
    recentRuns: runs,
    taskStats: taskStats.results.map((r) => ({
      ...r,
      description: TASK_DESCRIPTIONS[r.task] || "",
    })),
    recentErrors: recentErrors.results || [],
  };
}
