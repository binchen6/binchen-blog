const CJK_RE = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g;

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function truncateText(text: string, length: number = 150): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

export function generateExcerpt(content: string, length: number = 150): string {
  const plainText = content
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*|\*|__/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n/g, " ")
    .trim();
  return truncateText(plainText, length);
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function getReadingTime(content: string): number {
  // 中文按字符计（约 300 字/分钟），英文按词计（约 200 词/分钟）
  const cjkChars = (content.match(CJK_RE) || []).length;
  const latinWords = content.replace(CJK_RE, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(cjkChars / 300 + latinWords / 200));
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
