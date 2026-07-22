/**
 * lib/markdown.ts — 博客 Markdown 单一渲染来源
 *
 * 客户端按需动态加载 markdown-it 及插件（保持首屏 bundle 不膨胀）。
 * 供文章详情页、写作页预览等所有需要渲染 Markdown 的地方共用。
 *
 * 用法：
 *   const { html, toc } = await renderMarkdown(source);
 *   // html 已经过 DOMPurify 消毒，可直接 dangerouslySetInnerHTML
 *   // toc 与渲染期生成的标题锚点 100% 同步（h2/h3）
 */

export interface TocItem {
  /** 渲染期生成的唯一锚点 id，如 `h-前言`、`h-前言-1` */
  id: string;
  /** 剥离行内语法后的纯文本标题 */
  text: string;
  /** 2 | 3 */
  level: number;
}

export interface RenderMarkdownResult {
  html: string;
  toc: TocItem[];
}

/** 中文友好 slugify：保留中日韩文字与字母数字，空白转 -，标点去除（encodeURI 安全） */
export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** 剥离标题里的行内 Markdown 语法字符（用于 TOC 显示与 slug） */
function plainHeadingText(raw: string): string {
  return raw
    .replace(/[*_~`=[\]()^+]/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/** GitHub 风格 alert：`> [!note]` 等 */
const CALLOUT_TYPES = ["note", "tip", "important", "warning", "caution"] as const;
type CalloutType = (typeof CALLOUT_TYPES)[number];

const CALLOUT_LABELS: Record<CalloutType, string> = {
  note: "注记",
  tip: "提示",
  important: "重要",
  warning: "警告",
  caution: "注意",
};

export async function renderMarkdown(source: string): Promise<RenderMarkdownResult> {
  const [
    { default: MarkdownIt },
    { default: DOMPurify },
    { default: footnote },
    { default: taskLists },
    { default: mark },
    { default: sub },
    { default: sup },
    { default: abbr },
    { default: deflist },
    { default: ins },
  ] = await Promise.all([
    import("markdown-it"),
    import("dompurify"),
    import("markdown-it-footnote"),
    import("markdown-it-task-lists"),
    import("markdown-it-mark"),
    import("markdown-it-sub"),
    import("markdown-it-sup"),
    import("markdown-it-abbr"),
    import("markdown-it-deflist"),
    import("markdown-it-ins"),
  ]);

  const md = new MarkdownIt({ html: false, linkify: true, typographer: true })
    .use(footnote)
    .use(taskLists, { enabled: true, label: true })
    .use(mark)
    .use(sub)
    .use(sup)
    .use(abbr)
    .use(deflist)
    .use(ins);

  // ---- 标题锚点：渲染期生成唯一 id，并同步收集 TOC（h2/h3）----
  const toc: TocItem[] = [];
  const idCounts = new Map<string, number>();

  md.renderer.rules.heading_open = (tokens, idx, options, _env, self) => {
    const token = tokens[idx];
    const inline = tokens[idx + 1];
    const raw = inline && inline.type === "inline" ? inline.content : "";
    const text = plainHeadingText(raw);
    const base = slugifyHeading(text) || "section";
    const count = idCounts.get(base) ?? 0;
    idCounts.set(base, count + 1);
    const id = count === 0 ? `h-${base}` : `h-${base}-${count}`;
    token.attrSet("id", id);
    const level = Number(token.tag.slice(1));
    if ((level === 2 || level === 3) && text) {
      toc.push({ id, text, level });
    }
    return self.renderToken(tokens, idx, options);
  };

  // ---- Callout 提示块：> [!note] / [!tip] / [!important] / [!warning] / [!caution] ----
  const calloutMarker = new RegExp(`^\\[!(${CALLOUT_TYPES.join("|")})\\]\\s*`, "i");

  md.core.ruler.push("callout", (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== "blockquote_open") continue;

      // 找配对 close
      let depth = 0;
      let closeIdx = -1;
      for (let j = i; j < tokens.length; j++) {
        if (tokens[j].type === "blockquote_open") depth++;
        else if (tokens[j].type === "blockquote_close") {
          depth--;
          if (depth === 0) {
            closeIdx = j;
            break;
          }
        }
      }
      if (closeIdx < 0) continue;

      // 首个段落 inline
      const paraIdx = tokens[i + 1]?.type === "paragraph_open" ? i + 1 : -1;
      const inlineIdx = paraIdx > 0 && tokens[paraIdx + 1]?.type === "inline" ? paraIdx + 1 : -1;
      if (inlineIdx < 0) continue;

      const inline = tokens[inlineIdx];
      const children = inline.children ?? [];
      const first = children[0];
      if (!first || first.type !== "text") continue;
      const match = calloutMarker.exec(first.content);
      if (!match) continue;

      const type = match[1].toLowerCase() as CalloutType;

      // 移除标记文本（连同可能的换行）
      first.content = first.content.slice(match[0].length);
      if (first.content === "") {
        children.shift();
        if (children[0]?.type === "softbreak") children.shift();
      }

      // blockquote → div.callout.callout-{type}
      const open = tokens[i];
      open.type = "callout_open";
      open.tag = "div";
      open.attrSet("class", `callout callout-${type}`);

      const close = tokens[closeIdx];
      close.type = "callout_close";
      close.tag = "div";

      // 注入标题 <p class="callout-title">
      const TokenCtor = open.constructor as new (type: string, tag: string, nesting: number) => typeof open;
      const titleOpen = new TokenCtor("callout_title_open", "p", 1);
      titleOpen.attrs = [["class", "callout-title"]];
      const titleText = new TokenCtor("text", "", 0);
      titleText.content = CALLOUT_LABELS[type];
      const titleInline = new TokenCtor("inline", "", 0);
      titleInline.content = CALLOUT_LABELS[type];
      titleInline.children = [titleText];
      const titleClose = new TokenCtor("callout_title_close", "p", -1);
      tokens.splice(i + 1, 0, titleOpen, titleInline, titleClose);
      i += 3; // 跳过刚插入的 token

      // 标记独占一段时，删除留下的空段落
      if (children.length === 0) {
        tokens.splice(paraIdx + 3, 3); // paragraph_open / inline / paragraph_close（索引已被标题插入推移）
      }
    }
    return true;
  });

  // ---- 表格横向滚动容器（小屏防撑破布局）----
  md.renderer.rules.table_open = () => '<div class="table-wrap"><table>';
  md.renderer.rules.table_close = () => "</table></div>";

  const rendered = md.render(source);

  const html = DOMPurify.sanitize(rendered, {
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    ADD_ATTR: ["for", "checked", "disabled", "type", "id", "class", "title"],
  });

  return { html, toc };
}
