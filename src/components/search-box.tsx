"use client";

import { useEffect, useState } from "react";

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

type PagefindUiCtor = new (options: PagefindUiOptions) => unknown;

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

type SearchBoxProps = {
  initialKeyword?: string;
};

export function SearchBox({ initialKeyword }: SearchBoxProps) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        loadStyle("/pagefind/pagefind-ui.css");
        await loadScript("/pagefind/pagefind-ui.js");

        if (!window.PagefindUI) {
          throw new Error("PagefindUI unavailable");
        }

        const ui = new window.PagefindUI({
          element: "#search",
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
        });

        const urlParams = new URLSearchParams(window.location.search);
        const p = urlParams.get("p");
        const keyword = initialKeyword || p;

        if (keyword) {
          setTimeout(() => {
            const uiInstance = ui as any;
            if (typeof uiInstance.triggerSearch === "function") {
              uiInstance.triggerSearch(keyword);
            } else {
              const input = document.querySelector(
                ".pagefind-ui__search-input",
              ) as HTMLInputElement;
              if (input) {
                input.value = keyword;
                input.dispatchEvent(new Event("input", { bubbles: true }));
              }
            }
          }, 100);
        }

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
    };
  }, [initialKeyword]);

  if (state === "error") {
    return (
      <p className="text-sm text-amber-600 dark:text-amber-400">
        搜索索引尚未生成，请先执行 npm run build。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {state === "loading" ? (
        <p className="text-sm text-neutral-500">搜索模块加载中...</p>
      ) : null}
      <div id="search" className="pagefind-ui" />
    </div>
  );
}
