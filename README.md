# 尘墨 | binchen 博客

一幅徐徐展开的数字长卷。基于 **墨卷 InkScroll 2.0** 设计系统的新中式个人博客，部署在 Cloudflare 边缘网络上，零服务器成本运行。

![设计](https://img.shields.io/badge/设计-墨卷InkScroll%202.0-b8933f)
![部署](https://img.shields.io/badge/部署-Cloudflare%20Pages-orange)
![技术](https://img.shields.io/badge/技术-Next.js%2014%2BD1%2BEdge-green)

---

## 设计理念

**藏**（克制表达，不堆砌符号）· **叙**（内容是旅程不是陈列）· **双**（鼠标与触屏是两种生物）

- **长卷叙事**：首页淡墨山水长卷 + 竖排题字，文章按时间轴铺开
- **五级墨色**：墨·浓/重/中/淡/远 + 暖宣纸底，全系统字体栈零网络下载
- **AI 图形资产**：山水主视觉、朱砂印章、毛笔笔触分隔、墨晕、扁舟空状态（`mix-blend-mode: multiply` 融合）
- **双交互层**：鼠标端 hover 墨晕扩散/紧凑密度；触屏端底部 tab bar/文章操作栏/scroll-snap/≥44px 目标

## 功能全景

### 内容
- 📝 **Markdown 写作**：实时预览（脚注/任务列表/高亮）、草稿自动保存、图片库、朋友圈动态模式
- 📖 **阅读体验**：TOC 目录、代码复制、图片灯箱（ESC 关闭）、阅读进度条、上下篇导航、中文阅读时长
- 🔍 **文章列表**：搜索、模式/标签筛选、分页、帖式卡片（壹贰叁编号）
- 🖼️ **图片系统**：客户端压缩、GitHub 仓库 + Worker 代理（支持 `IMAGE_CDN=jsdelivr` 切换 CDN 直出）

### 社交
- 👤 **公开主页** `/users/[username]`：名片 + 其文章 + 关注按钮 + 粉丝数
- 🖼️ **头像系统**：上传（512px 方形裁剪）、历史头像保留 3 次可换回、不进图库
- ❤️ **点赞**：文章 + 评论，乐观更新动画
- 👥 **关注**：关注作者，通知回流
- 💬 **嵌套回复**：评论与留言板楼中楼、作者徽章、级联删除

### 消息
- 📮 **统一信箱** `/notifications`：@提及/回复/评论/留言/点赞/关注/公告七类消息
- 🔔 **导航铃铛**：未读角标，点击进信箱
- 📢 **公告**：管理员控制台发布 → 全服广播；登录用户未读弹窗强提醒，访客顶部横幅
- 🗑️ **消息管理**：单删/多选/全选删除，每人只留最近 30 条自动销毁

### 权限（五级角色）
| 角色 | 权限 |
|------|------|
| owner 站主 | 全部 |
| admin 管理员 | 控制台、用户/文章/评论/留言/图片管理 |
| editor 编辑 | 全部文章管理 |
| author 作者 | 自己的文章/图片 |
| member 成员 | 评论/留言/点赞/关注（**注册默认**，发文章需站主提升） |

匿名访客可评论/留言（开放政策），匿名不可点赞/关注。

### 管理
- 🎛️ **控制台 Tab 化**：概览/文章/用户/互动/图片/公告/性能，按需加载
- 👤 **个人中心**：资料、头像、修改密码、用户名申请（管理员审核）、我的文章/图片
- 🔐 **安全**：PBKDF2 密码哈希、JWT 7 天、全接口限流、CSP 安全头、参数化查询

### SEO
- RSS `/feed.xml`、Sitemap `/sitemap.xml`、robots.txt、独立页面标题、Open Graph

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS |
| 渲染 | 全站 Edge Runtime（Cloudflare Workers） |
| 数据库 | Cloudflare D1 (SQLite) |
| 图床 | GitHub 私有仓库 + Worker 字节代理（可选 jsDelivr） |
| 认证 | Jose (JWT) + PBKDF2 (Web Crypto) |
| 部署 | Cloudflare Pages + `@cloudflare/next-on-pages` |

## 快速部署

### 1. 创建 Cloudflare 资源

```bash
# D1 数据库
wrangler d1 create binchen-blog-db
# 记录 database_id 填入 wrangler.toml
```

### 2. 准备 GitHub 图床

创建 Fine-grained token，授予图片仓库 `Contents: Read and write` 权限。

### 3. 配置环境变量（Pages → 设置 → 环境变量）

| 变量 | 必需 | 说明 |
|------|:----:|------|
| `JWT_SECRET` | ✅ | ≥32 字符随机串 |
| `INIT_TOKEN` | ✅ | 数据库初始化令牌 |
| `GITHUB_TOKEN` | ✅ | 图床写入令牌 |
| `GITHUB_OWNER` | ✅ | GitHub 用户名 |
| `GITHUB_REPO` | ✅ | 图片仓库名 |
| `GITHUB_BRANCH` | 可选 | 默认 `main` |
| `GITHUB_UPLOAD_DIR` | 可选 | 默认 `uploads` |
| `CRON_SECRET` | 可选 | 性能调度密钥 |
| `NEXT_PUBLIC_SITE_URL` | 可选 | 站点 URL |
| `IMAGE_CDN` | 可选 | 设 `jsdelivr` 且仓库公开时图片走 CDN |
| `MAX_UPLOAD_MB` | 可选 | 上传大小上限，默认 25 |

### 4. 部署与初始化

```bash
npm install --include=dev   # 注意：必须带 --include=dev
npm run deploy              # pages:build + wrangler pages deploy

# 初始化数据库（幂等， schema 变更后也需重跑）
curl "https://你的域名/api/init?token=$INIT_TOKEN"
```

### 5. 本地开发

```bash
npm install --include=dev
npm run build   # 本地完整构建验证（tsc + next build 均可跑）
npm run dev
```

> ⚠️ **坑位提示**：
> - 本机若 npm 全局配置 `omit=dev`，devDependencies 会静默缺失，必须 `--include=dev`
> - `vercel` 已通过 package.json `overrides` 锁定 `34.3.1`（高版本依赖 async_hooks 会炸 Pages 构建）
> - `@cloudflare/next-on-pages` 锁定 `1.12.1`（1.13.x 要求 next≥14.3）
> - 本地不要跑 `npm run pages:build`（内存占用大，交给 Cloudflare Git 集成）

## 项目结构

```
app/
├── page.tsx                 # 首页（山水长卷 Hero + 时间轴）
├── blog/                    # 文章列表（帖式卡片）+ [slug] 详情
├── users/[username]/        # 公开主页
├── notifications/           # 信箱
├── write/                   # 写作（预览+自动保存草稿）
├── guestbook/               # 留言板
├── admin/                   # 控制台（Tab 化）
├── profile/                 # 个人中心
├── login/ register/         # 认证页
├── feed.xml/ sitemap.xml/ robots.txt/   # SEO 路由
└── api/
    ├── auth/                # login/register/me/password
    ├── posts/               # 文章 CRUD + [slug]/comments
    ├── likes/               # 点赞 toggle
    ├── users/[username]/    # 公开资料 + follow
    ├── notifications/       # 列表/删除 + read/标记
    ├── announcements/       # 公告（公开读/管理员写删）
    ├── guestbook/ upload/ images/ profile/ admin/ init/ cron/
components/
├── page-chrome.tsx          # SiteShell/PageHeader/EmptyState（扁舟）
├── navigation.tsx           # 顶部导航 + 移动 tab bar
├── user-avatar.tsx          # 统一头像组件
├── like-button.tsx          # 点赞按钮（authFetch）
├── notification-bell.tsx    # 铃铛+角标
├── announcement-center.tsx  # 公告弹窗/横幅
├── site-widgets.tsx         # BackToTop/ReadingProgress/Skeleton
└── toast.tsx                # 全局轻提示
lib/
├── auth.ts                  # 角色权限模型 + JWT
├── client-auth.ts           # useAuth/authFetch/storeAuth（前端统一认证）
├── notifications.ts         # 通知创建/@提及解析/广播/30条裁剪
├── db.ts                    # D1 封装 + 幂等建表迁移
├── security.ts              # 限流/CSP头/输入钳制
├── image-compress.ts        # 客户端图片压缩（含头像裁剪）
└── github-config.ts         # 图床配置
public/assets/ink/           # AI 生成图形资产
```

## API 一览

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/posts` | GET | 列表（q/tag/mode/featured/mine/admin/total） | 公开/分级 |
| `/api/posts` | POST | 发文 | author+ |
| `/api/posts/[slug]` | GET/PUT/DELETE | 详情（含 like_count）/ 改 / 删 | 公开/作者 |
| `/api/posts/[slug]/comments` | GET/POST/DELETE | 评论（嵌套回复） | 公开/开放/本人 |
| `/api/likes` | POST | 点赞 toggle | 登录 |
| `/api/users/[username]` | GET | 公开主页 + 其文章 + 关注状态 | 公开 |
| `/api/users/[username]/follow` | POST | 关注 toggle | 登录 |
| `/api/notifications` | GET/DELETE | 信箱（≤30 条）/ 删消息 | 登录 |
| `/api/notifications/read` | POST | 标记已读（单条/全部/公告） | 登录 |
| `/api/announcements` | GET/POST/DELETE | 最新公告 / 发布 / 删除 | 公开/管理员 |
| `/api/guestbook` | GET/POST/DELETE | 留言（嵌套回复） | 公开/开放/本人 |
| `/api/upload` | GET/POST | 图库（默认排除头像）/ 上传 | 登录 |
| `/api/images/[id]` | GET/DELETE | 图片代理（`?proxy=1` 强制代理）/ 删除 | 公开/本人 |
| `/api/profile` | GET/PATCH/POST | 资料 / 改资料 / 用户名申请 | 登录 |
| `/api/profile/avatar` | PUT | 换头像（历史轮换≤3） | 登录 |
| `/api/auth/password` | POST | 修改密码 | 登录 |
| `/api/admin/*` | - | 控制台接口族 | 管理员 |
| `/api/init` | GET | 建表迁移（幂等） | INIT_TOKEN |

## 性能指标（实测）

- TTFB 250–600ms（Cloudflare 边缘）
- 首屏 JS ~107KB（共享 87KB）
- 列表 API 不返回全文（LENGTH 估算阅读时长），省 300KB+ 流量
- 系统字体栈零下载（CSP `font-src 'self'` 兼容）
- AI 资产全部压缩（主视觉 154KB，装饰 <35KB）

## 浏览器支持

Chrome/Edge 90+、Firefox 88+、Safari 14+、iOS Safari 14+，全面支持 `prefers-reduced-motion`。

## 文档

- 设计系统：`DESIGN_SYSTEM.md`（墨卷 2.0 完整规范）

## 开源协议

MIT License

---

**行到水穷处，坐看云起时**

* InkScroll 2.0 · Built for Cloudflare Edge
