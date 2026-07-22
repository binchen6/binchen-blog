import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";
import mark from "markdown-it-mark";
import taskLists from "markdown-it-task-lists";

// 插件类型声明复用 types/markdown-it-plugins.d.ts

/** 站点级 feed 元数据（站长邮箱无环境配置，写死公开邮箱） */
const SITE = {
  title: "尘墨 | binchen",
  description: "喜欢自由与宁静地生活旅行者 —— 记录山海、片刻安宁与古今技术。",
  language: "zh-CN",
  editorEmail: "804758625@qq.com",
  editorName: "binchen",
  generator: "binchen-blog (Next.js + Cloudflare Pages)",
  docs: "https://www.rssboard.org/rss-specification",
  ttl: 60,
  feedPath: "/feed.xml",
} as const;

export interface FeedPostRow {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  mode: "article" | "moment";
  tags: string | null;
  published_at: string | null;
  created_at: string;
  author_name: string | null;
}

/** html:false + linkify:true：markdown-it 默认 validateLink 拦截 javascript: 等危险协议，Edge 无 DOM 无需 DOMPurify */
const md = new MarkdownIt({ html: false, linkify: true })
  .use(footnote)
  .use(mark)
  .use(taskLists);

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** CDATA 内容含 ]]> 时拆分，避免提前闭合 */
function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/** RFC-822 日期（toUTCString 输出即 RFC-822 兼容格式） */
function rfc822(date: string | null | undefined): string {
  const d = date ? new Date(date) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

/** HTML → 纯文本（剥离标签、实体、压缩空白；供 toPlainText 和 buildItem 共用） */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-zA-Z#0-9]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** markdown → 纯文本 */
function toPlainText(markdown: string): string {
  return htmlToPlainText(md.render(markdown));
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function buildItem(post: FeedPostRow, origin: string): string {
  const link = `${origin}/blog/${encodeURIComponent(post.slug)}`;
  const pubDate = rfc822(post.published_at || post.created_at);
  const author = escapeXml(post.author_name || SITE.editorName);
  const categories = (post.tags || "")
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => `      <category>${escapeXml(t)}</category>`)
    .join("\n");

  let title: string;
  let description: string;
  let contentEncoded = "";

  if (post.mode === "moment") {
    // 动态：纯文本短文，不渲染全文 markdown
    const plain = toPlainText(post.content);
    title = truncate(plain, 30) || "无题动态";
    description = escapeXml(truncate(plain, 500));
  } else {
    // 只渲染一次，同时用于 description 兜底和 content:encoded
    const html = md.render(post.content);
    title = post.title || "无题";
    description = escapeXml(post.excerpt?.trim() || truncate(htmlToPlainText(html), 200));
    contentEncoded = `\n      <content:encoded>${cdata(html)}</content:encoded>`;
  }

  return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${author}</author>
${categories ? `${categories}\n` : ""}      <description>${description}</description>${contentEncoded}
    </item>`;
}

/** 查询已发布文章+动态（联表取作者显示名），D1 故障时返回空数组由上层输出合法空 feed */
export async function fetchFeedPosts(db: D1Database, limit = 50): Promise<FeedPostRow[]> {
  try {
    const { results } = await db
      .prepare(
        `SELECT p.title, p.slug, p.content, p.excerpt, p.mode, p.tags,
                p.published_at, p.created_at,
                COALESCE(u.display_name, u.username) AS author_name
           FROM posts p
           LEFT JOIN users u ON u.id = p.author_id
          WHERE p.status = 'published'
          ORDER BY COALESCE(p.published_at, p.created_at) DESC
          LIMIT ?`
      )
      .bind(limit)
      .all<FeedPostRow>();
    return results;
  } catch (error) {
    console.error("RSS feed query failed:", error);
    return [];
  }
}

/** 构建完整 RSS 2.0 XML（含 atom/content 命名空间）；posts 为空也输出合法 feed */
export function buildFeedXml(posts: FeedPostRow[], origin: string): string {
  const items = posts.map((p) => buildItem(p, origin)).join("\n");
  const latest = posts[0]?.published_at || posts[0]?.created_at;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE.title)}</title>
    <link>${origin}</link>
    <atom:link href="${origin}${SITE.feedPath}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE.description)}</description>
    <language>${SITE.language}</language>
    <lastBuildDate>${rfc822(latest)}</lastBuildDate>
    <generator>${escapeXml(SITE.generator)}</generator>
    <managingEditor>${SITE.editorEmail} (${escapeXml(SITE.editorName)})</managingEditor>
    <ttl>${SITE.ttl}</ttl>
    <docs>${SITE.docs}</docs>
${items}
  </channel>
</rss>`;
}
