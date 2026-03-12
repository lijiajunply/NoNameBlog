"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type PagefindSearchItemData = {
  url: string;
  excerpt: string;
  meta?: {
    title?: string;
  };
  sub_results?: Array<{
    title: string;
    url: string;
    excerpt: string;
  }>;
};

type PagefindSearchItem = {
  id: string;
  data: () => Promise<PagefindSearchItemData>;
};

type PagefindSearchResponse = {
  results: PagefindSearchItem[];
};

type PagefindModule = {
  search: (
    term: string,
    options?: {
      filters?: Record<string, unknown>;
      sort?: Record<string, unknown>;
    },
  ) => Promise<PagefindSearchResponse>;
};

type SearchResult = {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  subResults: Array<{
    title: string;
    url: string;
    excerpt: string;
  }>;
};

type SearchBoxProps = {
  keyword?: string;
  emptyMessage?: string;
};

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url, window.location.origin);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

function decodeHtmlEntities(value: string) {
  if (typeof document === "undefined") {
    return value;
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function renderExcerpt(excerpt: string, keyPrefix: string) {
  const segments = excerpt.split(/(<mark>.*?<\/mark>)/g).filter(Boolean);
  let offset = 0;

  return segments.map((segment) => {
    const key = `${keyPrefix}-${offset}-${segment.length}`;
    offset += segment.length;

    if (segment.startsWith("<mark>") && segment.endsWith("</mark>")) {
      const content = segment.replace(/^<mark>|<\/mark>$/g, "");
      return <mark key={key}>{decodeHtmlEntities(content)}</mark>;
    }

    return <span key={key}>{decodeHtmlEntities(segment)}</span>;
  });
}

export function SearchBox({
  keyword = "",
  emptyMessage = "输入关键字后即可查看搜索结果。",
}: SearchBoxProps) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [results, setResults] = useState<SearchResult[]>([]);
  const moduleRef = useRef<PagefindModule | null>(null);
  const normalizedKeyword = keyword.trim();

  useEffect(() => {
    let cancelled = false;

    async function loadPagefind() {
      if (moduleRef.current) {
        return moduleRef.current;
      }

      try {
        const importPagefind = new Function("path", "return import(path)") as (
          path: string,
        ) => Promise<PagefindModule>;
        const pagefind = await importPagefind("/pagefind/pagefind.js");

        if (!cancelled) {
          moduleRef.current = pagefind;
        }

        return pagefind;
      } catch {
        if (!cancelled) {
          setState("error");
        }

        return null;
      }
    }

    async function runSearch() {
      if (!normalizedKeyword) {
        setResults([]);
        setState("idle");
        return;
      }

      setState("loading");

      const pagefind = await loadPagefind();
      if (!pagefind) {
        return;
      }

      try {
        const response = await pagefind.search(normalizedKeyword);
        const hydratedResults = await Promise.all(
          response.results.map(async (result) => {
            const data = await result.data();

            return {
              id: result.id,
              title: data.meta?.title ?? data.url,
              url: normalizeUrl(data.url),
              excerpt: data.excerpt,
              subResults:
                data.sub_results?.map((item) => ({
                  title: item.title,
                  url: normalizeUrl(item.url),
                  excerpt: item.excerpt,
                })) ?? [],
            } satisfies SearchResult;
          }),
        );

        if (cancelled) {
          return;
        }

        setResults(hydratedResults);
        setState("ready");
      } catch {
        if (!cancelled) {
          setState("error");
        }
      }
    }

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [normalizedKeyword]);

  if (state === "error") {
    return (
      <p className="text-sm text-amber-600 dark:text-amber-400">
        搜索索引尚未生成，请先执行 `npm run build && npm run postbuild`。
      </p>
    );
  }

  if (!normalizedKeyword) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {state === "loading" ? (
        <p className="text-sm text-neutral-500">搜索中...</p>
      ) : null}

      {state === "ready" && results.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          未找到和 “{normalizedKeyword}” 相关的结果。
        </p>
      ) : null}

      {results.length > 0 ? (
        <ol className="space-y-4">
          {results.map((result) => (
            <li
              key={result.id}
              className="rounded-2xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800 dark:bg-neutral-950/60"
            >
              <div className="space-y-2">
                <Link
                  href={result.url}
                  className="text-base font-semibold text-neutral-900 transition hover:text-neutral-600 dark:text-white dark:hover:text-neutral-300"
                >
                  {result.title}
                </Link>
                <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  {renderExcerpt(result.excerpt, result.id)}
                </p>
              </div>

              {result.subResults.length > 0 ? (
                <div className="mt-4 space-y-2 border-t border-neutral-200/70 pt-4 dark:border-neutral-800">
                  {result.subResults.slice(0, 3).map((item) => (
                    <div key={`${result.id}-${item.url}`} className="space-y-1">
                      <Link
                        href={item.url}
                        className="text-sm font-medium text-neutral-800 transition hover:text-neutral-600 dark:text-neutral-200 dark:hover:text-neutral-400"
                      >
                        {item.title}
                      </Link>
                      <p className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                        {renderExcerpt(
                          item.excerpt,
                          `${result.id}-${item.url}`,
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
