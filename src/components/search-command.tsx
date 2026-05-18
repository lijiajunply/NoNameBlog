"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type PagefindSearchItem = {
  id: string;
  data: () => Promise<{
    url: string;
    excerpt: string;
    meta?: { title?: string };
  }>;
};

type PagefindModule = {
  search: (term: string) => Promise<{ results: PagefindSearchItem[] }>;
};

type SearchResult = {
  id: string;
  title: string;
  url: string;
  excerpt: string;
};

const renderExcerpt = (excerpt: string, keyPrefix: string) => {
  const segments = excerpt.split(/(<mark>.*?<\/mark>)/g).filter(Boolean);

  return segments.map((segment, i) => {
    const key = `${keyPrefix}-${i}`;

    if (segment.startsWith("<mark>") && segment.endsWith("</mark>")) {
      const content = segment.replace(/^<mark>|<\/mark>$/g, "");
      return <mark key={key}>{content}</mark>;
    }

    return <span key={key}>{segment}</span>;
  });
};

type SearchCommandProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const pagefindRef = useRef<PagefindModule | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Load Pagefind on first open
  useEffect(() => {
    if (!open || pagefindRef.current) return;

    let cancelled = false;

    async function loadPagefind() {
      try {
        const importPagefind = new Function("path", "return import(path)") as (
          path: string,
        ) => Promise<PagefindModule>;
        const pagefind = await importPagefind("/pagefind/pagefind.js");
        if (!cancelled) {
          pagefindRef.current = pagefind;
        }
      } catch {
        // Pagefind not available
      }
    }

    loadPagefind();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Search via Pagefind
  useEffect(() => {
    if (!query.trim() || !pagefindRef.current) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    async function search() {
      const pagefind = pagefindRef.current;
      if (!pagefind) return;

      try {
        const response = await pagefind.search(query.trim());
        const hydrated: SearchResult[] = await Promise.all(
          response.results.slice(0, 8).map(async (r) => {
            const data = await r.data();
            return {
              id: r.id,
              title: data.meta?.title ?? data.url,
              url: data.url,
              excerpt: data.excerpt,
            };
          }),
        );

        if (!cancelled) {
          setResults(hydrated);
          setIsSearching(false);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setIsSearching(false);
        }
      }
    }

    const timer = setTimeout(search, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelect = useCallback(
    (url: string) => {
      onOpenChange(false);
      router.push(url);
    },
    [router, onOpenChange],
  );

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Command panel */}
      <div className="fixed inset-x-0 top-[15%] mx-auto max-w-lg px-4">
        <Command
          shouldFilter={false}
          className="shadow-2xl border border-neutral-200 dark:border-neutral-800"
        >
          <CommandInput
            placeholder="搜索文章..."
            value={query}
            onValueChange={setQuery}
            autoFocus
          />

          <CommandList>
            <CommandEmpty>
              {isSearching
                ? "搜索中..."
                : query.trim()
                  ? "未找到相关结果"
                  : "输入关键字搜索文章"}
            </CommandEmpty>

            {results.length > 0 && (
              <CommandGroup heading="搜索结果">
                {results.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelect(result.url)}
                    className="flex flex-col items-start gap-0.5 py-3"
                  >
                    <span className="font-medium text-sm truncate w-full">
                      {result.title}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-1">
                      {renderExcerpt(result.excerpt, result.id)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </div>
    </div>,
    document.body,
  );
}
