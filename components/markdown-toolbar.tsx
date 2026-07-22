"use client";

import { useState, type RefObject } from "react";
import {
  Bold,
  ChevronDown,
  Code,
  Code2,
  Footprints,
  Heading2,
  Heading3,
  Highlighter,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Megaphone,
  Minus,
  Strikethrough,
  Table,
  TextQuote,
  type LucideIcon,
} from "lucide-react";

interface MarkdownToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement>;
  onContentChange: (value: string) => void;
}

/** 一次编辑的完整描述：替换区间 + 新文本 + 恢复后的选区（绝对位置） */
interface EditSpec {
  replaceStart: number;
  replaceEnd: number;
  text: string;
  selStart: number;
  selEnd: number;
}

interface Ctx {
  value: string;
  start: number;
  end: number;
  selected: string;
}

const CALLOUT_TYPES = [
  { value: "note", label: "注记" },
  { value: "tip", label: "提示" },
  { value: "important", label: "重要" },
  { value: "warning", label: "警告" },
  { value: "caution", label: "注意" },
] as const;

export default function MarkdownToolbar({ textareaRef, onContentChange }: MarkdownToolbarProps) {
  const [calloutOpen, setCalloutOpen] = useState(false);

  /** 应用编辑：更新受控 value 后，在下一帧恢复焦点与选区（React 受控组件光标陷阱） */
  const apply = (build: (ctx: Ctx) => EditSpec) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { value, selectionStart: start, selectionEnd: end } = ta;
    const edit = build({ value, start, end, selected: value.slice(start, end) });
    onContentChange(value.slice(0, edit.replaceStart) + edit.text + value.slice(edit.replaceEnd));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(edit.selStart, edit.selEnd);
    });
  };

  /** 行内包裹：**加粗**、*斜体*、`代码` 等 */
  const wrap = (before: string, after: string, placeholder: string) =>
    apply(({ start, end, selected }) => {
      const inner = selected || placeholder;
      const text = before + inner + after;
      return {
        replaceStart: start,
        replaceEnd: end,
        text,
        selStart: start + before.length,
        selEnd: start + before.length + inner.length,
      };
    });

  /** 行级前缀：标题、引用、列表（作用于选区覆盖的所有行） */
  const linePrefix = (mkPrefix: (lineIndex: number) => string) =>
    apply(({ value, start, end }) => {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const nl = value.indexOf("\n", end);
      const lineEnd = nl === -1 ? value.length : nl;
      const lines = value.slice(lineStart, lineEnd).split("\n");
      const prefixed = lines.map((line, i) => (line.trim() === "" ? line : mkPrefix(i) + line)).join("\n");
      return {
        replaceStart: lineStart,
        replaceEnd: lineEnd,
        text: prefixed,
        selStart: lineStart,
        selEnd: lineStart + prefixed.length,
      };
    });

  /** 块级插入：代码块 / 表格 / 分隔线 / Callout，保证独占段落；{sel} 替换为选中文本或占位符 */
  const blockInsert = (block: string, placeholder?: string) =>
    apply(({ value, start, end, selected }) => {
      const needsLeadingBreak = start > 0 && value[start - 1] !== "\n";
      const needsExtraBreak = !needsLeadingBreak && start > 1 && value[start - 2] !== "\n";
      const leading = needsLeadingBreak ? "\n\n" : needsExtraBreak ? "\n" : "";
      const filled = block.split("{sel}").join(selected || placeholder || "");
      const trailing = filled.endsWith("\n") ? "\n" : "\n\n";
      const text = leading + filled + trailing;
      const phIndex = placeholder && !selected ? filled.indexOf(placeholder) : -1;
      const selStart = phIndex >= 0 ? start + leading.length + phIndex : start + text.length;
      return {
        replaceStart: start,
        replaceEnd: end,
        text,
        selStart,
        selEnd: phIndex >= 0 ? selStart + (placeholder?.length ?? 0) : selStart,
      };
    });

  const insertLink = () =>
    apply(({ start, end, selected }) => {
      const label = selected || "链接文字";
      const text = `[${label}](https://)`;
      const urlStart = start + label.length + 3; // "[label](".length
      return {
        replaceStart: start,
        replaceEnd: end,
        text,
        selStart: urlStart,
        selEnd: urlStart + "https://".length,
      };
    });

  const insertImage = () =>
    apply(({ start, end, selected }) => {
      const alt = selected || "图片描述";
      const text = `![${alt}](图片地址)`;
      const urlStart = start + alt.length + 4; // "![alt](".length
      return {
        replaceStart: start,
        replaceEnd: end,
        text,
        selStart: urlStart,
        selEnd: urlStart + "图片地址".length,
      };
    });

  const insertFootnote = () =>
    apply(({ start, end, selected }) => {
      const text = `${selected}[^1]`;
      return {
        replaceStart: start,
        replaceEnd: end,
        text,
        selStart: start + text.length - 2,
        selEnd: start + text.length - 1, // 选中编号 "1"，文末补 `[^1]: 说明`
      };
    });

  const insertCallout = (type: string) =>
    blockInsert(`> [!${type}]\n> 内容`, "内容");

  const buttons: Array<
    | { kind: "divider" }
    | { kind: "button"; icon: LucideIcon; title: string; onClick: () => void }
  > = [
    { kind: "button", icon: Bold, title: "加粗 **文本**", onClick: () => wrap("**", "**", "加粗文本") },
    { kind: "button", icon: Italic, title: "斜体 *文本*", onClick: () => wrap("*", "*", "斜体文本") },
    { kind: "button", icon: Strikethrough, title: "删除线 ~~文本~~", onClick: () => wrap("~~", "~~", "删除线") },
    { kind: "button", icon: Highlighter, title: "高亮 ==文本==", onClick: () => wrap("==", "==", "高亮文本") },
    { kind: "button", icon: Code, title: "行内代码 `code`", onClick: () => wrap("`", "`", "code") },
    { kind: "divider" },
    { kind: "button", icon: Heading2, title: "二级标题 ## ", onClick: () => linePrefix(() => "## ") },
    { kind: "button", icon: Heading3, title: "三级标题 ### ", onClick: () => linePrefix(() => "### ") },
    { kind: "button", icon: TextQuote, title: "引用 > ", onClick: () => linePrefix(() => "> ") },
    { kind: "divider" },
    { kind: "button", icon: List, title: "无序列表 - ", onClick: () => linePrefix(() => "- ") },
    { kind: "button", icon: ListOrdered, title: "有序列表 1. ", onClick: () => linePrefix((i) => `${i + 1}. `) },
    { kind: "button", icon: ListTodo, title: "任务列表 - [ ] ", onClick: () => linePrefix(() => "- [ ] ") },
    { kind: "divider" },
    { kind: "button", icon: Link2, title: "链接 [文字](url)", onClick: insertLink },
    { kind: "button", icon: Image, title: "图片 ![描述](url)", onClick: insertImage },
    { kind: "button", icon: Code2, title: "代码块 ```", onClick: () => blockInsert("```\n{sel}\n```", "代码") },
    { kind: "button", icon: Table, title: "表格（3 列 × 2 行模板）", onClick: () => blockInsert("| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n| 内容 | 内容 | 内容 |") },
    { kind: "button", icon: Minus, title: "分隔线 ---", onClick: () => blockInsert("---") },
    { kind: "button", icon: Footprints, title: "脚注 [^1]，文末补 [^1]: 说明", onClick: insertFootnote },
  ];

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto border border-mist bg-paper/60 p-1 whitespace-nowrap">
      {buttons.map((item, index) => {
        if (item.kind === "divider") {
          return <span key={`divider-${index}`} className="mx-1 h-4 w-px shrink-0 bg-mist" />;
        }
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            type="button"
            title={item.title}
            onClick={item.onClick}
            className="shrink-0 p-1.5 text-ink-light transition-colors hover:bg-paper-warm hover:text-cyan-dark"
          >
            <Icon size={15} />
          </button>
        );
      })}
      <span className="mx-1 h-4 w-px shrink-0 bg-mist" />
      <div className="relative shrink-0">
        <button
          type="button"
          title="Callout 提示块 > [!note]"
          onClick={() => setCalloutOpen((open) => !open)}
          className="inline-flex items-center gap-0.5 p-1.5 text-ink-light transition-colors hover:bg-paper-warm hover:text-cyan-dark"
        >
          <Megaphone size={15} />
          <ChevronDown size={11} />
        </button>
        {calloutOpen && (
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => setCalloutOpen(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <div className="absolute left-0 top-full z-20 mt-1 w-32 border border-mist bg-paper">
              {CALLOUT_TYPES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setCalloutOpen(false);
                    insertCallout(item.value);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-xs text-ink-light transition-colors hover:bg-paper-warm hover:text-cyan-dark"
                >
                  {item.label}（{item.value}）
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
