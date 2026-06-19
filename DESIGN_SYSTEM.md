# 尘墨|binchen · 国风古代科技风设计系统

> 版本: 1.1 | 更新日期: 2025-06-19

---

## 设计哲学

"以古为镜，以技为骨"——将中国传统美学中的水墨意境、青铜纹饰、天文意象与现代科技元素相融合，打造一套兼具东方韵味与科技质感的设计语言。

### 核心理念
- **宣纸为底**：以传统宣纸的温润质感为视觉基底
- **墨色为骨**：以墨色的浓淡变化构建层次
- **青铜为饰**：以青铜器的纹饰与色泽点缀细节
- **星图为灵**：以天文星图、罗盘的秩序感构建科技气质
- **朱砂为印**：以印章的朱砂红作为点睛之笔

---

## 配色方案

### 主色

| 名称 | 色值 | 用途 | Tailwind |
|------|------|------|----------|
| **墨黑** | `#0d0d0d` | 主标题、正文、深色背景 | `ink` |
| **宣纸白** | `#f8f5f0` | 页面背景、卡片底色 | `paper` |
| **暗青** | `#1a3a3a` | 科技主题色、强调色、边框 | `cyan-dark` |

### 辅助色

| 名称 | 色值 | 用途 | Tailwind |
|------|------|------|----------|
| **青铜金** | `#c9a84c` | 装饰元素、图标、高亮 | `bronze` |
| **朱砂红** | `#c23a30` | 印章、按钮、重点标注 | `cinnabar` |
| **墨灰** | `#4a4a4a` | 次要文字、描述 | `ink-light` |
| **淡墨** | `#8c8c8c` | 辅助文字、时间戳 | `ink-muted` |
| **宣纸暖** | `#ede8e0` | 卡片背景、区块底色 | `paper-warm` |
| **宣纸凉** | `#e5e0d8` | 区块交替底色 | `paper-cool` |

### 渐变

| 名称 | 渐变 | 用途 |
|------|------|------|
| **墨染渐变** | `linear-gradient(135deg, #0d0d0d 0%, #1a3a3a 100%)` | Hero 深色区块背景 |
| **青铜光泽** | `linear-gradient(135deg, #c9a84c 0%, #e8d5a3 50%, #c9a84c 100%)` | 文字高亮、装饰线 |
| **宣纸纹理** | `linear-gradient(135deg, #f8f5f0 0%, #ede8e0 100%)` | 卡片背景、区块底色 |

---

## 字体规范

### 字体栈

| 用途 | 字体 | Tailwind |
|------|------|----------|
| **标题** | `'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', serif` | `font-serif-zh` |
| **正文** | `'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif` | 默认 |
| **科技/数据** | `'JetBrains Mono', 'Noto Sans SC', monospace` | `font-mono-tech` |
| **印章** | `'Noto Serif SC', serif`（加粗，窄字间距） | `font-serif-zh font-bold` |

### 字号规范

| 层级 | 大小 | 字重 | 字间距 | 用途 |
|------|------|------|--------|------|
| **Hero 标题** | `text-5xl` (3rem) | 700 | 0.15em | 首页主标题 |
| **页面标题** | `text-4xl` (2.25rem) | 600 | 0.1em | 页面大标题 |
| **区块标题** | `text-3xl` (1.875rem) | 600 | 0.08em | 区块标题 |
| **卡片标题** | `text-xl` (1.25rem) | 500 | 0.05em | 卡片标题 |
| **正文** | `text-base` (1rem) | 400 | 0.02em | 段落文字 |
| **辅助文字** | `text-sm` (0.875rem) | 400 | 0.02em | 时间、标签 |
| **印章/标签** | `text-xs` (0.75rem) | 700 | 0.15em | 标签、印章 |
| **科技标注** | `text-xs` (0.75rem) | 400 | 0.05em | 英文标注、代码 |

---

## 页面背景规范

### 所有页面统一背景

每个页面必须包含以下背景层（按顺序，从底层到顶层）：

```jsx
{/* 1. 宣纸纹理背景 */}
<div className="absolute inset-0 paper-texture-bg opacity-80 pointer-events-none" />

{/* 2. 星图网格背景 */}
<div className="absolute inset-0 star-grid-bg opacity-40 pointer-events-none" />

{/* 3. 内容层 */}
<section className="relative z-10">...</section>
```

| 背景层 | 透明度 | 说明 |
|--------|--------|------|
| `paper-texture-bg` | **opacity-80** | 宣纸噪点纹理，80% 可见度 |
| `star-grid-bg` | **opacity-40** | 星图网格线，40% 可见度 |

### 装饰元素（可选）

```jsx
{/* 罗盘装饰 - 右上角，缓慢旋转 */}
<motion.div
  className="absolute top-24 right-10 md:right-24 opacity-25 pointer-events-none"
  animate={{ rotate: 360 }}
  transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
>
  <img src="/compass.svg" alt="" className="w-48 h-48 md:w-64 md:h-64" />
</motion.div>

{/* 齿轮装饰 - 左下角，反向旋转 */}
<motion.div
  className="absolute bottom-32 left-10 md:left-20 opacity-20 pointer-events-none"
  animate={{ rotate: -360 }}
  transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
>
  <img src="/gear.svg" alt="" className="w-32 h-32 md:w-48 md:h-48" />
</motion.div>
```

| 装饰 | 位置 | 透明度 | 旋转速度 |
|------|------|--------|----------|
| 罗盘 | 右上角 | **0.25** | 120s/圈 |
| 齿轮 | 左下角 | **0.20** | 80s/圈（反向） |

---

## 纹理与装饰

### 核心纹理

1. **宣纸纹理** (`paper-texture-bg`)
   - 使用 PNG 噪点纹理图片
   - 透明度 **80%**，营造宣纸的纤维质感
   - 应用于所有页面背景

2. **星图网格** (`star-grid-bg`)
   - 以 30px 为间隔的淡线网格
   - 交叉点添加微小星点（2px 圆点）
   - 透明度 **40%**，营造天文仪器感
   - 应用于所有页面背景

3. **水墨晕染** (ink-wash)
   - 径向渐变圆形，边缘模糊
   - 用于 Hero 区域背景装饰
   - 透明度 15-20%

### 装饰元素

1. **罗盘指针**
   - 缓慢旋转（120s/圈）
   - 透明度 0.25
   - 用于所有页面右上角装饰

2. **齿轮装饰**
   - 反向旋转（80s/圈）
   - 透明度 0.20
   - 用于所有页面左下角装饰

3. **青铜回纹**
   - 用于卡片顶部装饰线
   - 渐变色：透明 → 青铜金 → 透明

4. **云纹边框**
   - 中国传统云纹图案
   - 用于特殊区块边框装饰

---

## 组件风格

### 按钮

| 类型 | 类名 | 样式 |
|------|------|------|
| **主按钮** | `btn-ink` | 墨黑背景，宣纸白文字，悬停反色 + 青铜边框光泽扫过 |
| **次要按钮** | `btn-outline` | 透明背景，墨黑边框，悬停时填充墨黑 |
| **科技按钮** | `btn-tech` | **暗青背景，青铜金文字，带微光效果** |
| **印章按钮** | `seal-stamp` | 朱砂红边框，朱砂红文字，旋转 -2deg |

**按钮使用规范**：
- 表单提交：**`btn-tech`**（统一使用科技按钮）
- 主要操作：`btn-ink`
- 次要操作：`btn-outline`

### 卡片（毛玻璃卡片）

```jsx
<div className="bg-paper/80 backdrop-blur-sm border border-cyan-dark/10 rounded-lg p-8 shadow-lg relative overflow-hidden">
  {/* 顶部青铜装饰线 */}
  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-bronze to-transparent" />
  ...
</div>
```

| 属性 | 值 |
|------|-----|
| 背景 | `bg-paper/80` (80% 不透明) |
| backdrop-filter | `backdrop-blur-sm` |
| 边框 | `border-cyan-dark/10` (10% 透明度) |
| 圆角 | `rounded-lg` |
| 阴影 | `shadow-lg` |
| 顶部装饰线 | 青铜渐变线 `via-bronze` |

### 文章卡片（paper-card）

```jsx
<Link href="..." className="paper-card block h-full group">
  ...
</Link>
```

| 属性 | 值 |
|------|-----|
| 背景 | `linear-gradient(135deg, #faf8f3 0%, #f5f0e8 100%)` |
| 边框 | `1px solid rgba(26, 58, 58, 0.06)` |
| 顶部装饰线 | `linear-gradient(90deg, transparent 0%, #c9a84c 50%, transparent 100%)` |
| 悬停效果 | `translateY(-4px)` + 阴影扩散 |

### 输入框

```jsx
<input 
  className="w-full bg-paper/50 border-mist focus:border-cyan-dark focus:shadow-tech-glow-sm transition-all" 
/>
```

| 属性 | 值 |
|------|-----|
| 背景 | `bg-paper/50` (50% 不透明) |
| 边框 | `border-mist` (默认) |
| 聚焦边框 | `border-cyan-dark` |
| 聚焦阴影 | `tech-glow-sm` |
| 过渡 | `transition-all` |

### 导航栏

| 属性 | 值 |
|------|-----|
| 初始状态 | `bg-transparent` (透明) |
| 滚动后 | `bg-paper/90 backdrop-blur-md border-b border-cyan-dark/10` |
| Logo | 罗盘图标 + "尘墨 \| BINCHEN" |
| 链接 | 衬线体 + 悬停下划线展开 |
| 激活状态 | 暗青色下划线 |

---

## 动效规范

### 核心动效

| 动效 | 时长 | 缓动 | 用途 |
|------|------|------|------|
| **墨水晕染** | 1.5s | ease-out | 区块入场 |
| **缓慢旋转** | 120s | linear | 罗盘装饰 |
| **反向旋转** | 80s | linear | 齿轮装饰 |
| **上浮悬停** | 0.4s | ease | 卡片交互 |
| **下划线展开** | 0.4s | ease | 链接悬停 |
| **印章弹跳** | 0.3s | ease | 印章悬停 |
| **科技光效** | 4s | ease-in-out | 按钮光晕脉冲 |

### 页面过渡

- 使用 Framer Motion 的 `AnimatePresence`
- 淡入 + 微上移（y: 20 → 0）
- 时长 0.6-0.8s

---

## 布局规范

### 容器

- 最大宽度：1200px（`max-w-6xl`）
- 水平内边距：24px（`px-6`）
- 区块垂直间距：96px（`py-24`）

### 网格

- 文章卡片：1/2/3 列响应式
- 间距：32px（`gap-8`）

### 响应式断点

| 断点 | 宽度 | 调整 |
|------|------|------|
| **移动端** | < 768px | 单列，字号缩小 |
| **平板** | 768-1024px | 双列，中等字号 |
| **桌面** | > 1024px | 三列，完整字号 |

---

## 特殊效果

### 暗青科技光效

```css
.tech-glow {
  box-shadow: 0 0 20px rgba(26, 58, 58, 0.3),
              0 0 40px rgba(26, 58, 58, 0.1);
}

.tech-glow-sm {
  box-shadow: 0 0 10px rgba(26, 58, 58, 0.2),
              0 0 20px rgba(26, 58, 58, 0.05);
}
```

### 青铜文字光泽

```css
.bronze-text {
  background: linear-gradient(135deg, #c9a84c 0%, #e8d5a3 50%, #c9a84c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### 水墨遮罩

```css
.ink-mask {
  mask-image: radial-gradient(ellipse at center, black 60%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 60%, transparent 100%);
}
```

### 印章样式

```css
.seal-stamp {
  border: 2px solid var(--color-cinnabar);
  color: var(--color-cinnabar);
  padding: 0.25rem 0.5rem;
  font-family: 'Noto Serif SC', serif;
  font-weight: 700;
  display: inline-block;
  transform: rotate(-2deg);
  transition: transform 0.3s ease;
  letter-spacing: 0.15em;
  font-size: 0.75rem;
}

.seal-stamp:hover {
  transform: rotate(0deg) scale(1.05);
}
```

---

## 图片资源

| 文件名 | 路径 | 用途 | 说明 |
|--------|------|------|------|
| `paper-texture.png` | `/paper-texture.png` | 页面背景纹理 | 宣纸噪点纹理，800×800px |
| `star-grid.svg` | `/star-grid.svg` | 背景网格 | 星图网格线 + 星点，30px间隔 |
| `compass.svg` | `/compass.svg` | 页面装饰 | 罗盘图案，300×300px |
| `gear.svg` | `/gear.svg` | 科技装饰 | 齿轮图案，200×200px |
| `cloud-border.svg` | `/cloud-border.svg` | 边框装饰 | 云纹边框，400×40px |
| `ink-wash.png` | `/ink-wash.png` | 背景装饰 | 水墨晕染效果，400×400px |

---

## 页面实现规范

### 所有页面必须包含

1. **背景纹理**（`paper-texture-bg opacity-80`）
2. **星图网格**（`star-grid-bg opacity-40`）
3. **内容层**（`relative z-10`）
4. **装饰元素**（罗盘 + 齿轮，可选但推荐）

### 表单页面（登录/注册/留言/写作）

统一使用毛玻璃卡片样式：

```jsx
<div className="bg-paper/80 backdrop-blur-sm border border-cyan-dark/10 rounded-lg p-8 shadow-lg relative overflow-hidden">
  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-bronze to-transparent" />
  ...
</div>
```

- 表单提交按钮使用 `btn-tech`
- 输入框使用 `bg-paper/50` + `focus:shadow-tech-glow-sm`
- 标签图标使用 `text-bronze`

### 内容页面（文章列表/文章详情）

- 使用 `paper-card` 组件
- 卡片顶部有青铜渐变装饰线
- 时间戳使用 `font-mono-tech`
- 标签使用 `text-bronze`

### 导航栏行为

- 初始状态：透明背景
- 滚动后（>20px）：毛玻璃背景 + 底部边框
- Logo：罗盘图标（缓慢旋转）+ "尘墨 \| BINCHEN"
- 链接悬停：暗青色

---

## 应用示例

### 首页 Hero 区域

```
背景: paper-texture-bg (80%) + star-grid-bg (40%)
装饰: 罗盘 SVG (右上角, opacity-25, 120s旋转) + 齿轮 SVG (左下角, opacity-20, 反向80s旋转)
印章: seal-stamp "旅行者"
标题: "尘墨" - 尘字 bronze-text，墨字 ink
副标题: 衬线体 + mono-tech "<TRAVELER · CODER · DREAMER />"
按钮: btn-ink "阅读文章" + btn-tech "留下足迹"
```

### 文章卡片

```
组件: paper-card
顶部: 青铜渐变装饰线
图标: MapPin text-bronze
分类: font-mono-tech
标题: font-serif-zh
摘要: 默认字体
日期: font-mono-tech
标签: text-bronze
```

### 表单卡片

```
背景: bg-paper/80 backdrop-blur-sm
边框: border-cyan-dark/10
圆角: rounded-lg
阴影: shadow-lg
顶部: 青铜渐变装饰线
标题图标: text-bronze
输入框: bg-paper/50 border-mist focus:border-cyan-dark
提交按钮: btn-tech
```

---

## 文件清单

| 文件 | 路径 | 说明 |
|------|------|------|
| `tailwind.config.js` | 项目根目录 | 配色、字体、动画定义 |
| `app/globals.css` | `app/globals.css` | 全局样式、组件类定义 |
| `DESIGN_SYSTEM.md` | 项目根目录 | 本文档 |
| `public/paper-texture.png` | `public/` | 宣纸纹理图片 |
| `public/star-grid.svg` | `public/` | 星图网格 SVG |
| `public/compass.svg` | `public/` | 罗盘装饰 SVG |
| `public/gear.svg` | `public/` | 齿轮装饰 SVG |
| `public/ink-wash.png` | `public/` | 水墨晕染图片 |
| `public/cloud-border.svg` | `public/` | 云纹边框 SVG |

---

*设计系统版本: 1.1*
*更新日期: 2025-06-19*
*更新内容: 统一页面背景规范、毛玻璃卡片样式、表单样式、装饰元素透明度*