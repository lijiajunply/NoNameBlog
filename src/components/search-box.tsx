"use client";

import { useEffect, useId, useRef, useState } from "react";

type PagefindUiOptions = {
  element: string;
  showSubResults?: boolean;
  resetStyles?: boolean;
  translations?: {
    placeholder?: string;
    clear_search?: string;
    load_more?: string;
    search_label?: string;
    zero_results?: string;
    many_results?: string;
    one_result?: string;
  };
};

type PagefindUiInstance = {
  triggerSearch?: (term: string) => void;
};

type PagefindUiCtor = new (
  options: PagefindUiOptions,
) => PagefindUiInstance | unknown;

declare global {
  interface Window {
    PagefindUI?: PagefindUiCtor;
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

function loadStyle(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function syncSearchTerm(
  container: HTMLDivElement,
  ui: PagefindUiInstance | null,
  keyword: string,
) {
  const input = container.querySelector(
    ".pagefind-ui__search-input",
  ) as HTMLInputElement | null;

  if (input) {
    input.value = keyword;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  if (keyword && typeof ui?.triggerSearch === "function") {
    ui.triggerSearch(keyword);
  }
}

type SearchBoxProps = {
  keyword?: string;
  emptyMessage?: string;
};

export function SearchBox({
  keyword = "",
  emptyMessage = "输入关键字后即可查看搜索结果。",
}: SearchBoxProps) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const containerId = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const uiRef = useRef<PagefindUiInstance | null>(null);
  const normalizedKeyword = keyword.trim();

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        loadStyle("/pagefind/pagefind-ui.css");
        await loadScript("/pagefind/pagefind-ui.js");

        if (!mounted || !rootRef.current) {
          return;
        }

        if (!window.PagefindUI) {
          throw new Error("PagefindUI unavailable");
        }

        rootRef.current.innerHTML = "";
        uiRef.current = new window.PagefindUI({
          element: `#${containerId}`,
          showSubResults: true,
          resetStyles: false,
          translations: {
            placeholder: "搜索标题或正文...",
            clear_search: "清空",
            search_label: "搜索",
            zero_results: "未找到结果",
            one_result: "[COUNT] 条结果",
            many_results: "[COUNT] 条结果",
            load_more: "加载更多",
          },
        }) as PagefindUiInstance;

        if (mounted) {
          setState("ready");
        }
      } catch {
        if (mounted) {
          setState("error");
        }
      }
    }

    void init();

    return () => {
      mounted = false;
      uiRef.current = null;
    };
  }, [containerId]);

  useEffect(() => {
    if (state !== "ready" || !rootRef.current) {
      return;
    }

    syncSearchTerm(rootRef.current, uiRef.current, normalizedKeyword);
  }, [normalizedKeyword, state]);

  if (state === "error") {
    return (
      <p className="text-sm text-amber-600 dark:text-amber-400">
        搜索索引尚未生成，请先执行 `npm run build && npm run postbuild`。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {state === "loading" ? (
        <p className="text-sm text-neutral-500">搜索模块加载中...</p>
      ) : null}
      {!normalizedKeyword && state === "ready" ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {emptyMessage}
        </p>
      ) : null}
      <div
        ref={rootRef}
        id={containerId}
        className="pagefind-ui [&_.pagefind-ui__form]:hidden"
      />
    </div>
  );
}
