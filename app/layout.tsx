import type { Metadata } from "next";
import "./globals.css";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "binchen | 自由与宁静",
  description: "binchen 的个人博客 - 喜欢自由与宁静地生活旅行者",
  keywords: ["binchen", "博客", "旅行", "自由", "宁静"],
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
      <body className="paper-texture">
        {children}
      </body>
    </html>
  );
}
