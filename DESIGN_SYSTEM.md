# 尘墨 | binchen · 墨卷 InkScroll 2.0 设计系统

> 版本: 2.0 | 2026-07-22 | 取代 1.2「国风古代科技风」

## 设计宣言

1.0 是桌上的手账——宣纸、星图、罗盘，静态的装饰美学。
2.0 是展开的长卷——墨色、笔触、叙事，动态的阅读旅程。

核心理念：**藏**（克制表达，不堆砌符号）、**叙**（内容是旅程不是陈列）、**双**（鼠标与触屏是两种生物，不是一种）。

## 五级墨色

| 名 | 色值 | 用途 | Tailwind |
| --- | --- | --- | --- |
| 墨·浓 | `#16130e` | 标题、正文 | `ink` |
| 墨·重 | `#3d3629` | 次级正文 | `ink-2` / `ink-light` |
| 墨·中 | `#6b6252` | 辅助说明 | `ink-3` |
| 墨·淡 | `#a39a87` | 时间、标签 | `ink-4` / `ink-muted` |
| 墨·远 | `#cfc8b8` | 边框、分割 | `ink-5` / `mist` |
| 宣·纸 | `#f7f3ea` | 页面底色 | `paper` |
| 宣·影 | `#efe9db` | 分区底 | `paper-2` / `paper-warm` |
| 朱·砂 | `#b3352b` | 印章、强调、点赞 | `cinnabar` |
| 黛·青 | `#2f4a4a` | 链接、科技感 | `dai` / `cyan-dark` |
| 金·箔 | `#b8933f` | 点缀、精选 | `gold` / `bronze` |

> 1.x 色名全部保留为别名（`bronze`→gold、`cyan-dark`→dai、`mist`→ink-5），旧组件无缝工作。

## 字体

- 标题：系统宋体栈（`Songti SC, STSong, Noto Serif SC, SimSun`），零网络下载
- 正文：系统黑体栈（`-apple-system, PingFang SC, Microsoft YaHei`）
- 技术标注：`SF Mono, Cascadia Code, Consolas`
- 竖排点睛：`writing-mode: vertical-rl; text-orientation: upright`，仅用于题字/卷签，移动端自动横排

## 图形资产（AI 生成，`public/assets/ink/`）

| 文件 | 用途 |
| --- | --- |
| `ink-hero.jpg` (2560w, 154KB) | 首页山水长卷主视觉 |
| `brush-divider-1/2.jpg` | 毛笔笔触分隔（`mix-blend-mode: multiply` 融合宣纸） |
| `ink-blot-1/2.jpg` | 墨晕装饰（仅角落，不铺满） |
| `seal-logo.png` (480w) | 朱砂印章 logo（导航/页脚/Hero） |
| `empty-boat.jpg` | 空状态扁舟小景 |

## 页面结构

### 首页
- Hero：横贯全宽山水长卷 + 竖排题字「行到水穷处 坐看云起时」+ 印章 + 双 CTA
- 最新文章：纵向时间轴（`ink-timeline`）
- 精选：金箔标记三景
- 理念：藏 / 叙 / 双

### 文章列表
- 「帖」式卡片（`tie-card`）：左侧壹贰叁编号，整卡可点
- 搜索 + 模式筛选 + 标签云 + 加载更多

### 文章详情
- 桌面：右侧悬浮 TOC 面板
- 触屏：**底部操作栏**（点赞/评论/目录/分享，`action-bar`），替代全局 tab bar

### 导航
- 桌面：顶部横排（印章 logo + 竖排基准线 + 铃铛 + 头像）
- 移动：底部 tab bar（首页/文章/撰写/留言）+ 顶部精简条

## 双交互层

### 鼠标层 `@media (hover: hover) and (pointer: fine)`
- 卡片 hover：墨晕扩散（`ink-spread`，跟随 --mx/--my）
- tie-card hover：编号变朱砂、背景加深、箭头右移
- 紧凑密度、小目标可接受

### 触屏层 `@media (hover: none), (pointer: coarse)`
- 无 hover 依赖，所有信息默认可见
- 文章页底部操作栏（拇指区，≥44px 目标）
- 底部 tab bar 导航
- 精选横向 scroll-snap 滑动（`.snap-row`）
- `:active` 替代 `:hover` 反馈

工具类：`desktop-only-2`（触屏隐藏）、`touch-only-2`（鼠标隐藏）

## 性能规则（沿用 1.x 并强化）

- 字体全系统栈，零网络字体（CSP `font-src 'self'` 兼容）
- AI 资产全部压缩（hero 154KB、笔触 <35KB、墨晕 <125KB）
- 图像 `loading="lazy" decoding="async"`
- `prefers-reduced-motion` 全站降级
- Edge runtime 所有页面与 API

## Cloudflare Pages 注意事项（沿用）

- `export const runtime = "edge"` 仅放 layout/not-found/API route，客户端页面不导出
- 构建输出 `.vercel/output/static`，`vercel` 锁定 `34.3.1`（package.json overrides）
- `@cloudflare/next-on-pages` 锁定 `1.12.1`
- 本地构建：`npm install --include=dev`（本机 npm 全局 omit=dev）
