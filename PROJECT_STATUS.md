# 尘墨博客 · 项目状态

> 最后更新：2026-07-27 · 此文件记录项目当前状态、部署配置与运维要点
> 设计规范见 `DESIGN_SYSTEM.md`，功能与 API 文档见 `README.md`

---

## 一、项目概况

**binchen-blog**（尘墨）是部署在 Cloudflare 边缘网络上的个人博客，基于墨卷 InkScroll 2.0 新中式设计系统。零服务器成本运行，全站 Edge Runtime。

| 项 | 值 |
|----|-----|
| 生产域名 | https://cryoconite.cn |
| 仓库 | https://github.com/binchen6/binchen-blog |
| 部署方式 | Cloudflare Pages Git 集成（push main 自动构建） |
| D1 数据库 | `binchen-blog-db`（id: `7f97de5c-477b-49bb-85de-7a9d8076652e`） |
| 图床 | GitHub 私有仓库 + Worker 字节代理 |

## 二、技术栈

| 层 | 技术 | 备注 |
|----|------|------|
| 框架 | Next.js 14.2.35 (App Router) | 全站 `runtime = "edge"` |
| 语言 | TypeScript 严格模式 | 零 `any`，`.first<T>()` 泛型查询 |
| 样式 | Tailwind CSS 3 | `darkMode: 'class'`，79 条暗色规则 |
| 数据库 | Cloudflare D1 (SQLite) | 幂等迁移见 `lib/db.ts` |
| 认证 | Jose JWT (7d) + PBKDF2 100k | Web Crypto，Edge 兼容 |
| Markdown | markdown-it + 10 插件 | DOMPurify 消毒，渲染期生成 TOC 锚点 |
| 图床 | GitHub Contents API | 可选 `IMAGE_CDN=jsdelivr` 直出 |
| 构建 | `@cloudflare/next-on-pages` 1.12.1 | 版本锁定原因见「坑位」 |

## 三、部署配置

### 3.1 环境变量（Pages → 设置 → 环境变量）

| 变量 | 必需 | 说明 |
|------|:----:|------|
| `JWT_SECRET` | ✅ | ≥32 字符 |
| `INIT_TOKEN` | ✅ | 数据库初始化令牌 |
| `GITHUB_TOKEN` | ✅ | 图床 Fine-grained token（Contents: RW） |
| `GITHUB_OWNER` / `GITHUB_REPO` | ✅ | 图床仓库 |
| `GITHUB_BRANCH` / `GITHUB_UPLOAD_DIR` | 可选 | 默认 `main` / `uploads` |
| `CRON_SECRET` | 可选 | 性能调度密钥 |
| `IMAGE_CDN` | 可选 | `jsdelivr` 时公开仓库图片走 CDN |
| `MAX_UPLOAD_MB` | 可选 | 默认 25，硬上限 50 |
| `NEXT_PUBLIC_SITE_URL` | 可选 | metadataBase |

### 3.2 数据库初始化 / 迁移

```
GET https://cryoconite.cn/api/init?token=<INIT_TOKEN>
```

- **幂等**：`CREATE TABLE IF NOT EXISTS` + `addColumnIfMissing`，可反复执行
- schema 变更后必须重跑一次
- 附带：seed 五级角色权限组；无 owner 时自动提升用户 `binchen` 为站主
- 旧库数据迁移（跨 D1 实例）：`wrangler d1 export` 导出旧库 → `wrangler d1 execute <新库> --file=backup.sql --remote` 导入，再跑 init 对齐 schema

### 3.3 定时任务（可选）

`POST /api/cron/performance`（带 `x-cron-secret` 头）执行：限流桶清理 / 表行数快照 / PRAGMA optimize / 90 天前改名申请 + 30 天前性能事件清理。建议在 Pages Cron Triggers 配置每日触发。

## 四、功能现状（2026-07-27）

全部在线可用：Markdown 写作（工具栏/预览/草稿）· 朋友圈动态 · 图片库 · 评论/留言楼中楼（一层）· 点赞 · 关注/粉丝列表 · 统一信箱（七类消息，30 条自动销毁）· 公告广播 · 五级权限 · 控制台七 Tab · 暗色模式 · RSS/Sitemap

## 五、最近变更

| 提交 | 内容 |
|------|------|
| `5e1acfc` | README 全面更新（暗色模式/Callout/结构/安全） |
| `5f972b1` | 修复登录时序均衡失效（DUMMY_USER_HASH 长度错误→用户名可枚举）、留言板/评论孤儿回复校验、RETURNING null 守卫补全、prev/next 导航 id tiebreaker、authFetch 迁移、theme-toggle 闭包 bug |
| `7aa9e56` | 抽离 CommentSection 组件（page.tsx 707→499 行）；全项目 `: any` 清零（30 文件，ProfileUser/ImageAsset/PostWriteBody 等具名类型） |
| `930cf61` | 全面性能/安全/代码质量优化 |

## 六、坑位备忘

1. **npm 必须 `--include=dev`**：全局 `omit=dev` 会让 devDependencies 静默缺失
2. **版本锁定**：`vercel@34.3.1`（overrides，高版本 async_hooks 炸 Pages 构建）；`@cloudflare/next-on-pages@1.12.1`（1.13.x 要求 next≥14.3）
3. **本地不跑 `pages:build`**：内存占用大，交给 Cloudflare Git 集成；本地验证用 `npm run build`
4. **init 是 schema 迁移不是数据迁移**：换新 D1 实例需手动 export/import 数据
5. **上传 INSERT 后需二次 UPDATE 写 url**：`/api/images/{id}` 依赖自增 id，无法用单语句完成

## 七、架构要点

- **认证链**：登录 → JWT 存 localStorage → `authFetch` 自动附带 Bearer → 401 自动清理本地状态
- **权限模型**：五级角色（owner/admin/editor/author/member），`ROLE_PERMISSIONS` 声明式映射，路由用 `requireLogin/requirePermission/requireAdmin` 三级守卫
- **通知系统**：所有互动汇入 notifications 表，`createNotification` 自动跳过自通知，每人保留最新 30 条
- **评论/留言**：仅支持一层嵌套（UI + API 双重约束，父级必须是顶层，防孤儿回复）
- **Markdown 渲染**：`lib/markdown.ts` 唯一渲染源，TOC 锚点渲染期生成保证同步，DOMPurify 白名单消毒
- **限流**：内存桶（isolate 级，阈值≈limit×活跃 isolate 数），仅作低成本兜底
