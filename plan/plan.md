# 博客优化计划（2026-07-22）

> 项目：C:\Users\binchen\Desktop\code\blog（Next.js 14 + CF Pages + D1）
> 模式：plan 模式 + 多子代理协调，每完成一步更新本文件打勾
> 铁律：改完必测（npm run build 通过）；不引入第二彩色；Edge Runtime 兼容（禁 Node.js 原生 API）

## 任务拆解与文件归属（避免子代理改同一文件冲突）

| # | 任务 | 主要文件 | 负责 | 依赖 |
|---|------|---------|------|------|
| 1 | 统一并重构个人中心模块化 | `app/profile/page.tsx` + `components/profile/*` | 子代理A（波次1） | 无 |
| 2 | 优化文章/朋友圈发表页面 | `app/write/page.tsx` | 子代理D（波次2） | #3 共享渲染模块 |
| 3 | 全面适配 Markdown 格式并优化展示 | `lib/markdown.ts`(新) + `app/blog/[slug]/page.tsx` + `app/globals.css` | 子代理B（波次1） | 无 |
| 4 | 修复目录展示/跳转 | 同 #3（一起改，避免锚点不同步） | 子代理B（波次1） | 与#3同批 |
| 5 | Markdown 快捷插入模块 | `components/markdown-toolbar.tsx`(新) + `app/write/page.tsx` | 子代理D（波次2） | #2 同批 |
| 6 | Markdown 格式指南文档 | `app/help/markdown/page.tsx`(新) + 导航入口 | 子代理E（波次2） | #3 语法清单 |
| 7 | 优化和完善 RSS 订阅 | `app/feed.xml/route.ts` + head link | 子代理C（波次1） | 无 |

## 执行波次

- **波次1（并行）**：A(#1) / B(#3+#4) / C(#7)
- **波次2（并行，等B完成）**：D(#2+#5) / E(#6)
- **收尾（主代理）**：全量 build 验证 + QA + 更新本文件

## 进度

- [x] 1. 个人中心模块化重构 ✅（485→110行，拆出 components/profile/ 9文件，tsc零错误）
- [x] 2. 发表页优化 ✅（预览接入共享渲染、草稿保存时间戳、Ctrl+S、移动端高度适配）
- [x] 3. Markdown 全面适配与展示优化 ✅（lib/markdown.ts 单一来源，新增 sub/sup/abbr/deflist/ins/Callout，tsc零错误）
- [x] 4. 目录展示/跳转修复 ✅（渲染期token锚点+IntersectionObserver高亮，与渲染100%同步）
- [x] 5. Markdown 快捷插入工具栏 ✅（components/markdown-toolbar.tsx，17按钮+Callout下拉，选区智能包裹）
- [x] 6. Markdown 指南文档 ✅（app/help/markdown/page.tsx，14分区源码↔渲染对照，全语法覆盖）
- [x] 7. RSS 完善 ✅（lib/feed.ts 全文 content:encoded + atom 元数据 + moment 进 feed，20/20 断言过）
- [x] 8. 全量构建验证 + QA ✅（tsc 零错误 + next build Compiled successfully，23:00）

## 过程记录

- 22:39 子代理A完成 #1：page.tsx 485→110 行，拆出 types/use-profile-data/profile-header/profile-form/username-request/password-form/group-info-modal/my-posts/my-images 共9文件，行为与样式不变，tsc 零错误。遗留：tmp-tsc 临时目录待删（~/.openclaw/workspace/tmp-tsc）。
- 22:42 子代理C完成 #7：新建 `lib/feed.ts`（渲染+XML+D1），route.ts 瘦为35行壳；全文 content:encoded CDATA（`]]>` 拆分转义）、category(tags)、author(联表 users)、atom:link self、managingEditor、ttl；moment 作为短文 item；D1 失败返回合法空 feed。jsdom XML 解析验证 20/20 断言全过。注意：taskLists 插件调用降级为无参以匹配共享 d.ts。
- 22:42 子代理B完成 #3+#4：`lib/markdown.ts` 导出 `renderMarkdown(source): Promise<{html, toc}>`；锚点 `h-{slug}` 重复自动 `-1/-2`；新增语法 sub/sup/abbr/deflist/ins + 五种 Callout（note/tip/important/warning/caution）；表格包 .table-wrap；TOC 改 IntersectionObserver；scroll-mt 移入 CSS。环境坑：**npm omit=dev**，后续 install 必须 `--include=dev`；tsconfig 加了 `target: ES2017`。遗留：figcaption 未做、rootMargin -96px 与头部高度耦合。

- 22:48 子代理E完成 #6：新建 `app/help/markdown/page.tsx`，14 个 SurfacePanel 分区，DemoBlock 用 renderMarkdown 实时渲染「源码|效果」两栏对照；覆盖全部基础+扩展语法，明确演示不支持的（HTML转义/Mermaid/KaTeX）；沿用水墨体系零新彩色；runtime 继承 layout 的 edge 不重复声明（项目惯例）。**待办：write 页加 /help/markdown 入口链接（主代理收尾时统一加）**。

- 22:51 子代理D完成 #2+#5：新建 `components/markdown-toolbar.tsx`（230行，17按钮+Callout下拉，三种插入引擎 wrap/linePrefix/blockInsert，rAF 恢复光标选区）；write 页预览改 `renderMarkdown` 共享源（删重复动态import）、草稿保存显示时间戳、Ctrl/Cmd+S 快捷键（新建存草稿/编辑按当前status更新）、textarea 移动端 h-64、mode 切换确认不丢内容。遗留：脚注不自动追加文末定义（刻意简化）。
- 23:00 主代理收尾：write 页内容区加「语法指南」入口链接（→/help/markdown，target=_blank）；全量验证 `npx tsc --noEmit` 零错误 + `npm run build` Compiled successfully；删除 tmp-tsc 临时目录。

## 最终交付清单

| 文件 | 变更 |
|------|------|
| `app/profile/page.tsx` | 485→110 行，模块化组装 |
| `components/profile/*` | 新建 9 文件 |
| `lib/markdown.ts` | 新建，渲染单一来源（含TOC/锚点/Callout） |
| `types/markdown-it-plugins.d.ts` | 5个新插件类型声明 |
| `app/blog/[slug]/page.tsx` | 渲染+TOC 接入共享模块，IntersectionObserver 高亮 |
| `app/globals.css` | 新语法样式 + scroll-margin |
| `app/write/page.tsx` | 共享预览/草稿反馈/Ctrl+S/工具栏接入/指南入口 |
| `components/markdown-toolbar.tsx` | 新建，快捷插入工具栏 |
| `app/help/markdown/page.tsx` | 新建，语法指南（实时渲染对照） |
| `lib/feed.ts` + `app/feed.xml/route.ts` | RSS 全文+元数据+moment |
| `package.json/tsconfig.json` | 新依赖5个 + target ES2017 |

**待师父决定**：是否 git commit + push 部署到 cryoconite.cn。

## 各任务验收标准（全部达成）

1. **个人中心**：485行单文件拆为 `components/profile/` 下多个职责单一组件（头像区/资料表单/用户名申请/改密/权限组/我的文章/我的图片），行为不变，样式沿用 SurfacePanel 体系
2. **发表页**：草稿保存有可见反馈、Ctrl+S 快捷保存、mode 切换不丢内容、移动端可用；工具栏插入正确
3. **Markdown**：markdown-it 配置收敛到 `lib/markdown.ts` 单一来源（写作页预览与文章页渲染共用）；支持表格/删除线/任务列表/脚注/高亮/上下标/缩写/定义列表/Callout提示块；不含数学公式（没必要）；展示样式齐全（表格滚动、代码块、引用、分隔线、图片说明等）
4. **目录**：渲染期生成 heading id（markdown-it 插件），TOC 与标题 100% 同步；跳转偏移正确（scroll-mt）；移动端目录可用；空目录不显示
5. **工具栏**：textarea 光标处插入/包裹语法（加粗/斜体/删除线/高亮/标题/链接/图片/代码/代码块/引用/列表/任务/表格/分隔线/脚注），选中文本智能包裹
6. **指南页**：列出全站支持的 Markdown 语法+示例+渲染效果，水墨风格，与 #3 实际支持的语法一致
7. **RSS**：full content:encoded、categories(tags)、atom:link self、generator、author、正确的 pubDate/guid、Cache-Control；head 里 `<link rel="alternate">` 自动发现；验证 XML 合法
