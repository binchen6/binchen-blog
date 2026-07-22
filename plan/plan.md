# 博客第三轮优化（2026-07-22 23:33）

## 任务

- [ ] 1. 暗色模式"夜色宣纸"（CSS变量+Tailwind darkMode+组件适配）
- [ ] 2. 撰写页/指南页/Markdown渲染多端适配（移动端布局+操作逻辑）
- [ ] 3. 首页最近写的 limit 7→3
- [ ] 4. 文章列表序号最大"玖"（禁止翻页后溢出）
- [ ] 5. 冒烟测试+debug+深度优化

## 文件归属

| 子代理 | 范围 |
|--------|------|
| D1 | globals.css + tailwind.config.js + components — 暗色变量+Tailwind配置+组件暗色适配 |
| D2 | app/write + app/help/markdown + app/blog/[slug] + lib/markdown.ts — 多端适配 |
| D3 | app/page.tsx + app/blog/page.tsx — 首页limit+序号修复 |
