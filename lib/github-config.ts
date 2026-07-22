export type GithubImageConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  uploadDir: string;
  missing: string[];
  sources: {
    token: GithubConfigSource;
    owner: GithubConfigSource;
    repo: GithubConfigSource;
    branch: GithubConfigSource;
    uploadDir: GithubConfigSource;
  };
};

export type GithubConfigSource = "runtime" | "build" | "default" | "missing";

function readRuntimeEnvString(env: unknown, key: string): string {
  if (!env || typeof env !== "object") return "";
  return String((env as Record<string, unknown>)[key] ?? "").trim();
}

function readBuildEnvString(key: string): string {
  if (typeof process === "undefined") return "";

  const value = (() => {
    if (key === "GITHUB_TOKEN") return process.env.GITHUB_TOKEN;
    if (key === "GITHUB_OWNER") return process.env.GITHUB_OWNER;
    if (key === "GITHUB_REPO") return process.env.GITHUB_REPO;
    if (key === "GITHUB_BRANCH") return process.env.GITHUB_BRANCH;
    if (key === "GITHUB_UPLOAD_DIR") return process.env.GITHUB_UPLOAD_DIR;
    return undefined;
  })();

  return String(value || "").trim();
}

function readConfigValue(env: unknown, key: string, fallback = ""): { value: string; source: GithubConfigSource } {
  const runtimeValue = readRuntimeEnvString(env, key);
  if (runtimeValue) return { value: runtimeValue, source: "runtime" };

  const buildValue = readBuildEnvString(key);
  if (buildValue) return { value: buildValue, source: "build" };

  if (fallback) return { value: fallback, source: "default" };

  return { value: "", source: "missing" };
}

export function getGithubBuildEnvPresence(): Record<string, boolean> {
  return {
    GITHUB_TOKEN: Boolean(readBuildEnvString("GITHUB_TOKEN")),
    GITHUB_OWNER: Boolean(readBuildEnvString("GITHUB_OWNER")),
    GITHUB_REPO: Boolean(readBuildEnvString("GITHUB_REPO")),
    GITHUB_BRANCH: Boolean(readBuildEnvString("GITHUB_BRANCH")),
    GITHUB_UPLOAD_DIR: Boolean(readBuildEnvString("GITHUB_UPLOAD_DIR")),
  };
}

export function getGithubRuntimeEnvPresence(env: unknown): Record<string, boolean> {
  return {
    GITHUB_TOKEN: Boolean(readRuntimeEnvString(env, "GITHUB_TOKEN")),
    GITHUB_OWNER: Boolean(readRuntimeEnvString(env, "GITHUB_OWNER")),
    GITHUB_REPO: Boolean(readRuntimeEnvString(env, "GITHUB_REPO")),
    GITHUB_BRANCH: Boolean(readRuntimeEnvString(env, "GITHUB_BRANCH")),
    GITHUB_UPLOAD_DIR: Boolean(readRuntimeEnvString(env, "GITHUB_UPLOAD_DIR")),
  };
}

export function getRelatedRuntimeEnvKeys(env: unknown): string[] {
  if (!env || typeof env !== "object") return [];
  return Object.keys(env)
    .filter((key) => key.startsWith("GITHUB_") || key === "DB")
    .sort();
}

export function getGithubImageConfig(env: unknown): GithubImageConfig {
  const tokenConfig = readConfigValue(env, "GITHUB_TOKEN");
  const ownerConfig = readConfigValue(env, "GITHUB_OWNER");
  const repoConfig = readConfigValue(env, "GITHUB_REPO");
  const branchConfig = readConfigValue(env, "GITHUB_BRANCH", "main");
  const uploadDirConfig = readConfigValue(env, "GITHUB_UPLOAD_DIR", "uploads");
  const token = tokenConfig.value;
  const owner = ownerConfig.value;
  const repo = repoConfig.value;
  const branch = branchConfig.value;
  const uploadDir = uploadDirConfig.value.replace(/^\/+|\/+$/g, "");
  const missing = [
    ["GITHUB_TOKEN", token],
    ["GITHUB_OWNER", owner],
    ["GITHUB_REPO", repo],
  ].filter(([, value]) => !value).map(([key]) => key);

  return {
    token,
    owner,
    repo,
    branch,
    uploadDir,
    missing,
    sources: {
      token: tokenConfig.source,
      owner: ownerConfig.source,
      repo: repoConfig.source,
      branch: branchConfig.source,
      uploadDir: uploadDirConfig.source,
    },
  };
}
