"use client";

import { ReactNode, useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { PageHeader, SiteShell, SurfacePanel } from "@/components/page-chrome";
import { renderMarkdown } from "@/lib/markdown";
import { useDocumentTitle } from "@/lib/use-document-title";

/** 单个语法示例：左源码 / 右渲染（小屏上下堆叠），渲染走全站同一 renderMarkdown 管线 */
function DemoBlock({ source, note }: { source: string; note?: string }) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    renderMarkdown(source)
      .then(({ html }) => {
        if (!cancelled) { setHtml(html); setLoading(false); }
      })
      .catch(() => {
        if (!cancelled) { setHtml(""); setLoading(false); }
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="min-w-0">
        <p className="mb-2 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-ink-3">源码</p>
        <pre className="h-full overflow-x-auto whitespace-pre border border-mist bg-paper/70 p-4 font-mono-tech text-xs leading-relaxed text-ink-2">{source}</pre>
      </div>
      <div className="min-w-0">
        <p className="mb-2 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-ink-3">渲染效果</p>
        {loading ? (
          <div className="min-h-[6rem] border border-mist bg-paper/40 p-4">
            <div className="skeleton h-3 w-3/4" />
            <div className="skeleton mt-2 h-3 w-full" />
            <div className="skeleton mt-2 h-3 w-1/2" />
          </div>
        ) : (
          <div
            className="markdown-content h-full border border-mist bg-paper/40 p-4 text-sm leading-loose text-ink-light"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
        {note && <p className="mt-2 text-xs leading-relaxed text-ink-3">{note}</p>}
      </div>
    </div>
  );
}

function GuideSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <SurfacePanel className="p-6 md:p-8">
      <h2 className="font-serif-zh text-xl font-semibold tracking-[0.1em] text-ink md:text-2xl">{title}</h2>
      {description && <p className="mt-3 text-sm leading-loose text-ink-2">{description}</p>}
      <div className="mt-6 space-y-8">{children}</div>
    </SurfacePanel>
  );
}

const DEMO_HEADING = `# 一级标题
## 二级标题
### 三级标题`;

const DEMO_INLINE = `**加粗** 与 *斜体*，还有 ~~删除线~~ 与 ==高亮==。
行内代码：\`const a = 1\`。
上标：x^2^，下标：H~2~O，插入文本：++新加入的文字++。`;

const DEMO_CODE = `\`\`\`ts
function greet(name: string) {
  return \`你好，\${name}\`;
}
\`\`\``;

const DEMO_QUOTE = `> 山有木兮木有枝，
> 心悦君兮君不知。`;

const DEMO_CALLOUT = `> [!note] 注记：补充背景信息。

> [!tip] 提示：帮你少走弯路的小技巧。

> [!important] 重要：务必阅读的内容。

> [!warning] 警告：操作前请三思。

> [!caution] 注意：此操作可能有风险。`;

const DEMO_LIST = `- 无序列表项一
- 无序列表项二

1. 有序列表项一
2. 有序列表项二

- [ ] 未完成的任务
- [x] 已完成的任务`;

const DEMO_LINK_IMAGE = `[回到首页](/)

![墨点](/assets/ink/ink-blot-1.webp)`;

const DEMO_HR = `上文段落。

---

下文段落。`;

const DEMO_TABLE = `| 语法 | 效果 |
| ---- | ---- |
| \`**粗体**\` | **加粗文字** |
| \`==高亮==\` | ==高亮文字== |
| \`~~删除~~\` | ~~删除线~~ |`;

const DEMO_FOOTNOTE = `这里有第一个脚注[^1]，还有第二个脚注[^2]。

[^1]: 脚注内容会自动收集到文末。
[^2]: 点击编号可在正文与脚注之间跳转。`;

const DEMO_ABBR = `*[HTML]: 超文本标记语言

把鼠标悬停在 HTML 上，可以看到完整释义。`;

const DEMO_DEFLIST = `术语一
: 这是术语一的定义。

术语二
: 定义列表适合名词解释类的内容。`;

const DEMO_NO_HTML = `<span style="color:red">这行 HTML 标签不会被解析，会被转义为纯文本。</span>`;

const DEMO_NO_MERMAID = `\`\`\`mermaid
graph TD; A-->B;
\`\`\``;

const DEMO_NO_MATH = `行内公式 $E = mc^2$ 与 $$ 块级公式都会按原样输出，不会渲染为数学公式。`;

export default function MarkdownGuidePage() {
  useDocumentTitle("Markdown 指南");

  return (
    <SiteShell>
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-28">
        <PageHeader
          eyebrow="MARKDOWN GUIDE"
          title="Markdown 指南"
          description="本站支持的全部 Markdown 语法速查。每个示例左侧为源码、右侧为实时渲染效果，与文章页共用同一条渲染管线。"
          icon={<BookOpen size={22} />}
        />

        <div className="mt-12 space-y-8">
          <GuideSection
            title="标题"
            description="支持 # 至 ### 三级标题。文章页会为 h2 / h3 自动生成锚点 id（如 h-前言），并据此生成右侧目录，点击目录项即可跳转到对应小节。"
          >
            <DemoBlock source={DEMO_HEADING} note="渲染后的 h2 / h3 标签自带唯一锚点 id，与文章目录完全同步。" />
          </GuideSection>

          <GuideSection title="行内样式" description="加粗、斜体、删除线、高亮、行内代码，以及上标、下标、插入文本。">
            <DemoBlock source={DEMO_INLINE} />
          </GuideSection>

          <GuideSection title="代码块" description="用三个反引号包裹代码，开头可标注语言（如 ts、python、bash）。">
            <DemoBlock source={DEMO_CODE} />
          </GuideSection>

          <GuideSection title="引用" description="以 > 开头的段落会渲染为引用块。">
            <DemoBlock source={DEMO_QUOTE} />
          </GuideSection>

          <GuideSection
            title="Callout 提示块"
            description="在引用块首行写 [!note] / [!tip] / [!important] / [!warning] / [!caution]，即可渲染为五种不同样式的提示块。"
          >
            <DemoBlock source={DEMO_CALLOUT} note="五种样式自上而下依次为：注记、提示、重要、警告、注意。" />
          </GuideSection>

          <GuideSection title="列表" description="支持无序列表、有序列表与任务列表（- [ ] 未完成 / - [x] 已完成）。">
            <DemoBlock source={DEMO_LIST} />
          </GuideSection>

          <GuideSection title="链接与图片" description="[文字](地址) 插入链接，![替代文字](图片地址) 插入图片。">
            <DemoBlock source={DEMO_LINK_IMAGE} />
          </GuideSection>

          <GuideSection title="分隔线" description="单独一行的 --- 会渲染为水平分隔线。">
            <DemoBlock source={DEMO_HR} />
          </GuideSection>

          <GuideSection title="表格" description="用竖线分隔列、第二行 --- 分隔表头与内容。小屏下表格可横向滚动。">
            <DemoBlock source={DEMO_TABLE} />
          </GuideSection>

          <GuideSection title="脚注" description="正文用 [^编号] 标注，文末用 [^编号]: 内容 定义，渲染后自动收集到文末并支持双向跳转。">
            <DemoBlock source={DEMO_FOOTNOTE} />
          </GuideSection>

          <GuideSection title="缩写" description="用 *[缩写]: 全称 定义缩写，正文中的对应词会带有下划线点，悬停显示全称。">
            <DemoBlock source={DEMO_ABBR} />
          </GuideSection>

          <GuideSection title="定义列表" description="术语独占一行，下一行以 : 开头写定义。">
            <DemoBlock source={DEMO_DEFLIST} />
          </GuideSection>

          <GuideSection
            title="不支持的语法"
            description="以下语法本站暂不支持，请知悉：HTML 标签会被转义为纯文本；Mermaid 图表只会作为普通代码块显示；数学公式 / KaTeX 不会渲染。"
          >
            <DemoBlock source={DEMO_NO_HTML} note="HTML 标签一律转义，不会被执行，这也是全站防注入的一部分。" />
            <DemoBlock source={DEMO_NO_MERMAID} note="mermaid 代码块按普通代码原样展示，不渲染图表。" />
            <DemoBlock source={DEMO_NO_MATH} />
          </GuideSection>

          <SurfacePanel className="p-6 md:p-8">
            <p className="text-sm leading-loose text-ink-2">
              本页所有示例均由全站同一渲染管线（lib/markdown.ts）实时渲染，所见即所得——你在撰写页写下的语法，发表后就是这个样子。
            </p>
          </SurfacePanel>
        </div>
      </section>
    </SiteShell>
  );
}
