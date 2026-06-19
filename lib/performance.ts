import { cleanupRateLimitBuckets } from "./security";

export type PerformanceTaskResult = {
  task: string;
  status: "ok" | "error";
  durationMs: number;
  details: Record<string, unknown>;
};

async function recordEvent(db: any, result: PerformanceTaskResult) {
  await db.prepare(
    "INSERT INTO performance_events (task, status, duration_ms, details) VALUES (?, ?, ?, ?)"
  ).bind(result.task, result.status, result.durationMs, JSON.stringify(result.details)).run();
}

async function runTask(db: any, task: string, fn: () => Promise<Record<string, unknown>> | Record<string, unknown>): Promise<PerformanceTaskResult> {
  const started = Date.now();
  try {
    const details = await fn();
    const result: PerformanceTaskResult = {
      task,
      status: "ok",
      durationMs: Date.now() - started,
      details,
    };
    await recordEvent(db, result);
    return result;
  } catch (error) {
    const result: PerformanceTaskResult = {
      task,
      status: "error",
      durationMs: Date.now() - started,
      details: { message: error instanceof Error ? error.message : "Unknown error" },
    };
    await recordEvent(db, result);
    return result;
  }
}

export async function runPerformanceSchedule(db: any): Promise<PerformanceTaskResult[]> {
  const results: PerformanceTaskResult[] = [];

  results.push(await runTask(db, "rate-limit-cleanup", () => ({
    removedBuckets: cleanupRateLimitBuckets(),
  })));

  results.push(await runTask(db, "database-health", async () => {
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
  }));

  results.push(await runTask(db, "database-optimize", async () => {
    await db.prepare("PRAGMA optimize").run();
    return { optimized: true };
  }));

  results.push(await runTask(db, "retention-cleanup", async () => {
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
  }));

  return results;
}

export async function getPerformanceSummary(db: any) {
  const events = await db.prepare(
    `SELECT *
     FROM performance_events
     ORDER BY created_at DESC
     LIMIT 100`
  ).all();
  const slowTasks = await db.prepare(
    `SELECT task, AVG(duration_ms) AS avg_duration_ms, MAX(duration_ms) AS max_duration_ms, COUNT(*) AS runs
     FROM performance_events
     WHERE created_at > datetime('now', '-7 days')
     GROUP BY task
     ORDER BY max_duration_ms DESC`
  ).all();
  const failures = await db.prepare(
    `SELECT task, COUNT(*) AS failures, MAX(created_at) AS last_failed_at
     FROM performance_events
     WHERE status = 'error' AND created_at > datetime('now', '-7 days')
     GROUP BY task
     ORDER BY failures DESC`
  ).all();
  return {
    events: events.results || [],
    slowTasks: slowTasks.results || [],
    failures: failures.results || [],
  };
}
