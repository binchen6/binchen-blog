"use client";

import { useEffect } from "react";

/** 客户端页面独立标题（全站不再共用一个 title） */
export function useDocumentTitle(title?: string, description?: string) {
  useEffect(() => {
    if (title) document.title = `${title} | binchen`;
    if (description) {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = description;
    }
  }, [title, description]);
}
