# 尘墨 | binchen · 国风古代科技风设计系统

> 版本: 1.2 | 更新日期: 2026-06-19

## 设计定位

以“宣纸为底、墨色为骨、青铜为饰、星图为序、朱砂为印”为核心，把个人博客做成安静但有仪器感的图文空间。页面不追求堆叠装饰，而是让留白、纹理、图文比例和可读性成为主要气质。

首页第一屏必须明确传达个人简介：

> binchen，喜欢自由与宁静地生活旅行者

## 色彩

| 名称 | 色值 | 用途 | Tailwind |
| --- | --- | --- | --- |
| 墨黑 | `#0d0d0d` | 标题、正文、深色块 | `ink` |
| 墨灰 | `#4a4a4a` | 次级正文 | `ink-light` |
| 淡墨 | `#8c8c8c` | 时间、说明、辅助信息 | `ink-muted` |
| 宣纸白 | `#f8f5f0` | 页面背景 | `paper` |
| 宣纸暖 | `#ede8e0` | 分区背景 | `paper-warm` |
| 暗青 | `#1a3a3a` | 科技感主色、焦点、链接 | `cyan-dark` |
| 青铜金 | `#c9a84c` | 装饰线、图标、强调 | `bronze` |
| 朱砂红 | `#c23a30` | 印章、错误、重点提醒 | `cinnabar` |
| 雾线 | `#d4cfc7` | 输入框与细边框 | `mist` |

## 字体与文字

- 标题：`font-serif-zh`，用于页面标题、文章标题、卡片标题。
- 正文：默认 sans，行高保持 `1.8`，适合中文长文阅读。
- 技术标注：`font-mono-tech`，用于英文 eyebrow、日期、阅读数、状态。
- 字距只使用正向 letter spacing，不使用负字距，也不随 viewport 缩放字体。

## 页面结构

所有页面统一使用 `SiteShell`：

```tsx
<SiteShell>
  <section className="mx-auto max-w-6xl px-6 pb-20 pt-28">
    ...
  </section>
</SiteShell>
```

`SiteShell` 负责：

- 固定导航 `Navigation`
- 宣纸纹理层 `paper-texture`
- 星图网格层 `star-grid`
- 罗盘、齿轮、水墨装饰
- 页脚 `Footer`

页面内部不再重复声明背景层，避免维护成本和重复动效。

## 组件规范

### `PageHeader`

用于列表页、写作页、留言页等页面标题区。包含 icon、eyebrow、title、description 和青铜分隔线。

### `SurfacePanel`

用于表单、文章正文容器、重点信息块。

- 背景：`rgba(248, 245, 240, 0.82)`
- 边框：`rgba(26, 58, 58, 0.1)`
- 圆角：`8px`
- 顶部青铜装饰线
- 轻微玻璃模糊与阴影

### `paper-card`

用于文章卡片、留言卡片等可重复内容。

- 圆角不超过 `8px`
- 悬停只做轻微上浮和阴影扩散
- 卡片顶部有青铜渐变细线
- 封面图使用固定比例容器，避免布局跳动

### 按钮

- 主操作：`btn-ink`
- 表单提交、发布、登录：`btn-tech`
- 次级动作：`btn-outline`
- 所有按钮必须有 `focus-visible` 样式。

## 页面规则

### 首页

- 第一屏展示 `binchen`、个人简介和两个主要入口：阅读文章、留下足迹。
- 右侧使用罗盘/档案面板形成国风科技视觉锚点。
- 下方展示精选文章和设计逻辑，不能变成纯营销页。

### 文章列表

- 使用三列响应式卡片。
- 封面图懒加载：`loading="lazy"`、`decoding="async"`。
- 空状态提供写作入口。

### 文章详情

- Markdown 默认不允许原始 HTML：`html: false`。
- 文章正文放入 `SurfacePanel`，评论独立分区。
- 封面图使用固定比例容器。

### 表单页

- 登录、注册、写作、留言统一使用 `SurfacePanel`。
- 输入框背景为 `bg-paper/60`，焦点使用暗青边框与轻光晕。
- 提交按钮统一使用 `btn-tech`。

## 动效与性能

- 背景装饰由 CSS 驱动，避免每页重复 Framer Motion 无限动画。
- 重复列表项默认不使用 `whileInView` 批量动画，保证滚动稳定。
- 支持 `prefers-reduced-motion: reduce`，自动降低动效。
- 共享背景和组件，减少页面重复 DOM。
- 图片上传使用 GitHub + jsDelivr 图床，生产环境无需 R2。
- Next 图片配置为 `unoptimized: true`，适配 Cloudflare Pages 静态输出。

## Cloudflare Pages 注意事项

- `export const runtime = "edge"` 放在 `app/layout.tsx`、`app/not-found.tsx` 和所有 API route。
- 客户端组件和 `"use client"` 页面不导出 `runtime`，避免构建错误。
- Cloudflare Pages 构建输出目录为 `.vercel/output/static`。
- `vercel` 版本固定为 `34.3.1`，避免高版本依赖 `async_hooks` 导致 Pages 构建失败。

## 资源

| 文件 | 用途 |
| --- | --- |
| `public/paper-texture.png` | 宣纸纹理 |
| `public/star-grid.svg` | 星图网格 |
| `public/compass.svg` | 罗盘装饰 |
| `public/gear.svg` | 齿轮装饰 |
| `public/ink-wash.png` | 水墨晕染 |
| `public/cloud-border.svg` | 云纹边框 |
