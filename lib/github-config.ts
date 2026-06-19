export type GithubImageConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  uploadDir: string;
  missing: string[];
};

function readEnvString(env: any, key: string): string {
  return String(env?.[key] || "").trim();
}

export function getGithubImageConfig(env: any): GithubImageConfig {
  const token = readEnvString(env, "GITHUB_TOKEN");
  const owner = readEnvString(env, "GITHUB_OWNER");
  const repo = readEnvString(env, "GITHUB_REPO");
  const branch = readEnvString(env, "GITHUB_BRANCH") || "main";
  const uploadDir = (readEnvString(env, "GITHUB_UPLOAD_DIR") || "uploads").replace(/^\/+|\/+$/g, "");
  const missing = [
    ["GITHUB_TOKEN", token],
    ["GITHUB_OWNER", owner],
    ["GITHUB_REPO", repo],
  ].filter(([, value]) => !value).map(([key]) => key);

  return { token, owner, repo, branch, uploadDir, missing };
}
