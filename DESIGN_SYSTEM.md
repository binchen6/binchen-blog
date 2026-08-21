# 尘墨 | binchen · 墨卷 InkScroll 3.0 设计系统

> 版本: 3.0 | 2026-08-21 | 现代化修订：token 层 · 控件标准 · 排版标尺 · 资产透明化
> 2.0 的设计宣言与五级墨色保持不变，3.0 在其上确立工程化标准。

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

## 作品页与滚动显现（2026-08 增补）

- 路由：`/works`（作品架）、`/CryClaw`（产品静态站，`public/CryClaw/`，`<base href>` 归位相对资源）、`/cryclaw` 经 `_redirects` 301 到 `/CryClaw`
- `.work-featured`：深色旗舰卡（硬编码深色，双主题一致），`--mx/--my` 鼠标跟随光斑，只写 CSS 变量不触发 layout
- `.work-card`：浅色作品卡，hover 上浮 + 金箔描边 + 光泽扫过（`::after` transform）
- `[data-reveal]` + `lib/use-reveal.ts`：IntersectionObserver 滚动显现，`prefers-reduced-motion` 降级为直显
- 首页结构：Hero 长卷 → 作品速览（CryClaw 旗舰 + 地理专题 + 作品架入口）→ 最新文章(5) → 精选(3) → 理念

---

## 3.0 现代化标准（2026-08-21）

### Token 层（globals.css 末尾覆盖层）

| Token | 值 | 用途 |
| --- | --- | --- |
| `--r-sm/md/lg/xl` | 6 / 10 / 16 / 22px | 圆角阶：按钮 md、卡片 lg、旗舰卡 xl |
| `--shadow-1/2/3` | 三档 elevation | 静息 / hover / 旗舰悬浮；暗色自动换纯黑深影 |
| `--ease-standard` | cubic-bezier(.22,.61,.36,1) | 全站统一缓动 |
| `--dur-fast` / `--dur` | .18s / .28s | 微交互 / 常规过渡 |

### 控件标准

- **按钮**（`.btn-ink` 主 / `.btn-outline` 次 / `.btn-tech` 技术）：圆角 `--r-md`，`:active` scale(.97)，过渡 `--dur` + `--ease-standard`，focus 金环 2px offset 3px。触屏最小高度 44px。
- **卡片**：`.paper-card` 内容卡（lg + shadow-1 → hover shadow-2 + translateY(-4px)）；`.surface-panel` 面板（lg + shadow-2 + 金箔顶线）；`.work-card` 作品卡（lg + 光泽扫过）；`.work-featured` 旗舰卡（xl + shadow-3 + 鼠标光斑）。
- **新写组件禁止自定义圆角/阴影/缓动**，一律引用 token。

### 排版标尺

| 层级 | 规格 | 场景 |
| --- | --- | --- |
| Display | serif-zh 44-72px / 1.2 / tracking .12em | Hero 名 |
| H2 区题 | serif-zh 28-30px / tracking .1em / bold | 页面分区 |
| H3 卡题 | serif-zh 18-22px / tracking .05em | 卡片标题 |
| 正文 | sans 14-16px / 1.8 / tracking .02em | 通用（文章 17px / 38em 上限） |
| 辅助 | sans 12-14px / ink-3 | 说明文字 |
| Eyebrow | mono 11-12px / uppercase / tracking .18em / dai-70%（工具类 `.t-eyebrow`） | 分区眉标 |
| 数据 | mono + tabular-nums | 日期、统计 |

### 资产标准（红线）

- **装饰素材一律透明底 WebP**，禁止白底 JPG 直接上图（白边在暗色模式突兀）。
- 白底水墨素材处理管线：`unblend_white()`（亮度→alpha + 白色反解混）+ alpha 色调分离（24 阶）压缩，脚本见 `scripts/optimize_ink_assets.py` + `scripts/tune_ink_assets.py`。
- 暗色模式：墨色装饰用 `filter: invert(.86) sepia(.15)` 反相为暖灰；**印章等彩色素材禁止反相**。
- 体积红线：装饰图 < 60KB，Hero < 160KB，favicon/og 必备（`app/icon.png` + `/assets/og-image.jpg`）。
- 现状：seal 258KB→10KB、blot-1 121KB→47KB、hero 153KB→29KB、paper-texture 986KB→1KB。

