import type { Metadata } from "next";
import "./globals.css";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "binchen | 自由与宁静",
  description: "binchen 的个人博客，记录自由、宁静、旅行、生活与技术。",
  keywords: ["binchen", "个人博客", "旅行", "自由", "宁静", "国风科技"],
  authors: [{ name: "binchen" }],
  openGraph: {
    title: "binchen | 自由与宁静",
    description: "喜欢自由与宁静地生活旅行者",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
