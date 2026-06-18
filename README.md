# binchen 博客

一个融合**原研哉极简美学**与**国风古代科技感**的个人博客系统，支持图文撰写、用户系统、留言板功能，可部署在 Cloudflare Pages 上。

![设计风格](https://img.shields.io/badge/设计-原研哉%2B国风科技-blue)
![部署](https://img.shields.io/badge/部署-Cloudflare%20Pages-orange)
![技术](https://img.shields.io/badge/技术-Next.js%2014%2BD1%2BGitHub%20jsDelivr-green)

## 设计特色

### 视觉风格
- **原研哉极简留白**：大量留白空间，宣纸质感背景，低饱和度自然色调
- **国风古代科技元素**：水墨晕染效果、罗盘装饰、印章风格、竖排文字排版
- **字体搭配**：Noto Serif SC（标题）+ Noto Sans SC（正文），营造传统与现代交融

### 配色方案
| 名称 | 色值 | 用途 |
|------|------|------|
| 墨黑 | `#1a1a1a` | 主文字、按钮 |
| 宣纸 | `#f5f0e8` | 背景色 |
| 朱砂 | `#c9372c` | 强调色、链接、印章 |
| 古铜 | `#8b6914` | 装饰元素、图标 |
| 雾灰 | `#d4cfc7` | 边框、分割线 |

### 动画效果
- 页面滚动渐入动画（Framer Motion）
- 水墨扩散效果（CSS ink-spread）
- 罗盘旋转装饰（CSS rotate-slow）
- 印章悬停效果（CSS transform）
- 自定义滚动条与悬浮状态

## 功能特性

### 核心功能
- ✅ **图文在线撰写**：支持 Markdown 格式、封面图片上传、标签设置
- ✅ **用户系统**：注册、登录、JWT 认证、会话管理
- ✅ **留言板**：访客留言、匿名留言、时间排序展示
- ✅ **博客展示**：文章列表、详情页、阅读统计、评论系统
- ✅ **响应式设计**：完美适配桌面、平板、移动设备

### 技术栈
- **前端**：Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **动画**：Framer Motion + CSS Keyframes
- **数据库**：Cloudflare D1 (SQLite Edge)
- **图床**：GitHub 仓库 + jsDelivr CDN
- **认证**：Jose (JWT) + bcryptjs
- **部署**：Cloudflare Pages (@cloudflare/next-on-pages)

## 快速部署

### 前置要求
- [Cloudflare](https://dash.cloudflare.com) 账号
- [Node.js](https://nodejs.org) 18+ 环境
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) 已安装

### 步骤 1：创建 Cloudflare 资源

#### 1.1 创建 D1 数据库
```bash
wrangler d1 create binchen-blog-db
```
记录返回的 `database_id`，更新 `wrangler.toml`：
```toml
[[d1_databases]]
binding = "DB"
database_name = "binchen-blog-db"
database_id = "你的-database-id"
```

#### 1.2 准备 GitHub 图床
创建一个 GitHub Fine-grained token，授予目标图片仓库 `Contents: Read and write` 权限。

推荐使用独立公开仓库保存图片，例如 `binchen-blog-images`，方便 jsDelivr 公开访问。

#### 1.3 生成 JWT 密钥
```bash
openssl rand -base64 32
```
将生成的密钥添加到 Cloudflare Pages 环境变量：`JWT_SECRET`

### 步骤 2：配置环境变量

在 Cloudflare Dashboard → Pages → 项目设置 → 环境变量中添加：

| 变量名 | 值 | 说明 |
|--------|------|------|
| `JWT_SECRET` | 随机字符串 | JWT 签名密钥 |
| `NEXT_PUBLIC_SITE_URL` | `https://你的域名.pages.dev` | 站点 URL |
| `GITHUB_TOKEN` | GitHub Fine-grained token | 写入图片仓库 |
| `GITHUB_OWNER` | GitHub 用户名或组织名 | 例如 `binchen6` |
| `GITHUB_REPO` | 图片仓库名 | 例如 `binchen-blog-images` |
| `GITHUB_BRANCH` | 分支名 | 可选，默认 `main` |
| `GITHUB_UPLOAD_DIR` | 上传目录 | 可选，默认 `uploads` |

### 步骤 3：部署

```bash
# 安装依赖
npm install

# 构建并部署
npm run deploy
```

### 步骤 4：初始化数据库

部署完成后，访问以下 URL 初始化数据库表结构：
```
https://你的域名.pages.dev/api/init
```

返回 `{"success": true}` 表示数据库初始化成功。

## 本地开发

```bash
# 安装依赖
npm install

# 本地开发（需要配置 wrangler.toml 本地数据库）
npm run dev

# 或者使用 Wrangler 本地预览
npm run preview
```

## 项目结构

```
blog/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 首页（个人简介+动画）
│   ├── layout.tsx          # 根布局
│   ├── globals.css         # 全局样式（国风主题）
│   ├── blog/               # 博客页面
│   │   ├── page.tsx        # 文章列表
│   │   └── [slug]/         # 文章详情
│   ├── write/              # 撰写页面
│   ├── guestbook/          # 留言板
│   ├── login/              # 登录
│   ├── register/           # 注册
│   └── api/                # API 路由
│       ├── init/           # 数据库初始化
│       ├── auth/           # 认证接口
│       ├── posts/          # 文章 CRUD
│       ├── upload/         # 图片上传
│       └── guestbook/      # 留言板接口
├── components/             # 组件
│   ├── navigation.tsx      # 导航栏
│   └── footer.tsx          # 页脚
├── lib/                    # 工具库
│   ├── db.ts               # 数据库操作
│   ├── auth.ts             # 认证工具
│   ├── types.ts            # 类型定义
│   └── utils.ts            # 通用函数
├── public/                 # 静态资源
├── wrangler.toml           # Cloudflare 配置
├── next.config.js          # Next.js 配置
├── tailwind.config.js      # Tailwind 主题配置
└── package.json
```

## API 接口

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/init` | GET | 初始化数据库 | 否 |
| `/api/auth/register` | POST | 用户注册 | 否 |
| `/api/auth/login` | POST | 用户登录 | 否 |
| `/api/auth/me` | GET | 当前用户信息 | 是 |
| `/api/posts` | GET | 获取文章列表 | 否 |
| `/api/posts` | POST | 创建文章 | 是 |
| `/api/posts/:slug` | GET | 获取文章详情 | 否 |
| `/api/posts/:slug/comments` | GET | 获取评论 | 否 |
| `/api/posts/:slug/comments` | POST | 发表评论 | 否 |
| `/api/upload` | POST | 上传图片 | 是 |
| `/api/guestbook` | GET | 获取留言 | 否 |
| `/api/guestbook` | POST | 发表留言 | 否 |

## 自定义配置

### 修改个人简介
编辑 `app/page.tsx` 中的 Hero Section：
```tsx
<h1 className="font-serif-zh text-5xl md:text-7xl font-bold tracking-wider mb-6">
  binchen
</h1>
<p className="font-serif-zh text-xl md:text-2xl text-ink-light tracking-widest mb-4">
  喜欢自由与宁静地生活旅行者
</p>
```

### 修改配色
编辑 `tailwind.config.js` 和 `app/globals.css` 中的 CSS 变量。

### 修改字体
在 `app/layout.tsx` 中引入其他 Google Fonts，并在 `tailwind.config.js` 中配置。

## 性能优化

- 使用 Cloudflare Edge Network，全球 CDN 加速
- D1 数据库边缘查询，延迟低于 50ms
- GitHub 图片存储 + jsDelivr CDN 加速
- Next.js 静态优化 + 边缘渲染
- 字体使用 `font-display: swap` 策略

## 浏览器支持

- Chrome / Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Chrome Android 90+

## 开源协议

MIT License

---

**以简驭繁 · 宁静致远**

* Designed with the aesthetics of Kenya Hara and ancient Chinese technology
* Built for Cloudflare Edge
