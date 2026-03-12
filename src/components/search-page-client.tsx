"use client";

import { SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchBox } from "@/components/search-box";

export function SearchPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeKeyword = searchParams.get("q") ?? searchParams.get("p") ?? "";
  const [keyword, setKeyword] = useState(activeKeyword);

  useEffect(() => {
    setKeyword(activeKeyword);
  }, [activeKeyword]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          全文搜索
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          输入关键字，搜索文章标题和正文内容。
        </p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();

          const nextKeyword = keyword.trim();
          const nextHref = nextKeyword
            ? `${pathname}?q=${encodeURIComponent(nextKeyword)}`
            : pathname;

          router.push(nextHref);
        }}
      >
        <label
          htmlFor="search-page-keyword"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          搜索关键字
        </label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input
            id="search-page-keyword"
            type="search"
            placeholder="例如：Next.js、Linux、Mermaid"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white dark:focus:border-neutral-600"
          />
        </div>
      </form>

      <SearchBox keyword={activeKeyword} />
    </div>
  );
}
