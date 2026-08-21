/** 作品行（与 D1 works 表同构；页面首屏兜底 + 初始化种子 + 控制台「载入默认」用） */
export interface WorkItem {
  id?: number;
  title: string;
  badge: string;
  year: string;
  description: string;
  tags: string;
  href: string;
  external: number;
  cta: string;
  icon: string;
  accent: string;
  cover: string;
  repo: string;
  featured: number;
  sort_order: number;
  visible: number;
}

export const DEFAULT_WORKS: WorkItem[] = [
  {
    title: "CryoClaw",
    badge: "Flagship",
    year: "2026 · 持续更新",
    description: "高效、易用、纯净的 OpenClaw 桌面客户端。一分钟装好，即刻开聊——零配置、零依赖，487 个测试用例全绿。",
    tags: "Electron,TypeScript,双通道自动更新,≈0.6s 冷启动",
    href: "/CryClaw",
    external: 0,
    cta: "进入产品页",
    icon: "/CryClaw/assets/icon.png",
    accent: "gold",
    cover: "",
    repo: "https://github.com/binchen6/CryoClaw",
    featured: 1,
    sort_order: 0,
    visible: 1,
  },
  {
    title: "地图上的裂痕",
    badge: "地理专题",
    year: "2026",
    description: "一篇可以滚动探索的交互式地理长卷——板块、裂谷与时间的刻度，在地图上徐徐展开。",
    tags: "交互长文,数据可视化,独立页面",
    href: "/geography",
    external: 0,
    cta: "进入专题",
    icon: "compass",
    accent: "dai",
    cover: "/assets/works/geography.webp",
    repo: "",
    featured: 0,
    sort_order: 1,
    visible: 1,
  },
  {
    title: "尘墨博客",
    badge: "本站",
    year: "2026",
    description: "你现在站的地方。Next.js + Cloudflare Pages + D1，自研「墨卷」设计系统，从零手搓的全栈小站。",
    tags: "Next.js,Edge 全栈,设计系统",
    href: "/blog",
    external: 0,
    cta: "读文章",
    icon: "globe",
    accent: "gold",
    cover: "/assets/works/blog.webp",
    repo: "https://github.com/binchen6/binchen-blog",
    featured: 0,
    sort_order: 2,
    visible: 1,
  },
  {
    title: "第七频率",
    badge: "视觉小说",
    year: "2026",
    description: "一部网页视觉小说：从 218 个文件重构到 65 个，QA 评级 A。关于频率、信号与相遇的故事。",
    tags: "视觉小说,Web,开源",
    href: "https://github.com/binchen6/project-seventh-frequency",
    external: 1,
    cta: "GitHub 仓库",
    icon: "gamepad",
    accent: "cinnabar",
    cover: "/assets/works/seventh-frequency.webp",
    repo: "https://github.com/binchen6/project-seventh-frequency",
    featured: 0,
    sort_order: 3,
    visible: 1,
  },
  {
    title: "小明连点器",
    badge: "桌面工具",
    year: "2026",
    description: "Windows 桌面自动化小工具：连点、配置方案、托盘常驻。单文件 exe，开箱即用。",
    tags: "Python,Win32,托盘工具",
    href: "https://github.com/binchen6/autoclicker",
    external: 1,
    cta: "GitHub 仓库",
    icon: "mouse",
    accent: "ink",
    cover: "/assets/works/clicker.webp",
    repo: "https://github.com/binchen6/autoclicker",
    featured: 0,
    sort_order: 4,
    visible: 1,
  },
];
