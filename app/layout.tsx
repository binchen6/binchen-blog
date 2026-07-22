import type { Metadata, Viewport } from "next";
import "./globals.css";

export const runtime = "edge";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://cryoconite.cn"),
  title: {
    default: "binchen | 自由与宁静",
    template: "%s | binchen",
  },
  description: "binchen 的个人博客，记录自由、宁静、旅行、生活与技术。",
  keywords: ["binchen", "个人博客", "旅行", "自由", "宁静", "国风科技"],
  authors: [{ name: "binchen" }],
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "binchen | 自由与宁静",
    description: "喜欢自由与宁静地生活旅行者",
    type: "website",
    locale: "zh_CN",
    siteName: "尘墨 | binchen",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preload" href="/fonts/LXGWWenKaiGB-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
