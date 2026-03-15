"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FriendFeedItem } from "@/types/rss";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

const ITEMS_PER_PAGE = 10;

export function MomentsContent() {
  const [items, setItems] = useState<FriendFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/feed-cache.json")
      .then((res) => res.json())
      .then((data: FriendFeedItem[]) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">朋友圈</h2>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
            <div
              key={i}
              className="min-h-20 animate-pulse rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
              <div className="ml-20 mt-2 space-y-1">
                <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <MomentsCard items={items} />;
}

export function MomentsCard({ items }: { items: FriendFeedItem[] }) {
  const pathname = usePathname();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [contextListShow, setContextListShow] = useState<"list" | "grid">(() =>
    typeof window !== "undefined" && window.innerWidth < 1024 ? "list" : "grid",
  );

  // sync layout with window width
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setContextListShow(window.innerWidth < 1024 ? "list" : "grid");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // sync page from URL on mount and back/forward
  useEffect(() => {
    const syncFromUrl = () => {
      const p = Number.parseInt(
        new URLSearchParams(window.location.search).get("p") ?? "1",
        10,
      );
      setCurrentPage(Number.isNaN(p) || p < 1 ? 1 : p);
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * ITEMS_PER_PAGE;
  const visibleItems = items.slice(start, start + ITEMS_PER_PAGE);

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("p", String(page));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const updatePage = (page: number) => {
    setCurrentPage(page);
    router.replace(buildHref(page), { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">朋友圈</h2>
        <ToggleGroup
          variant="outline"
          type="single"
          size="sm"
          value={contextListShow}
          onValueChange={(value) => {
            if (value === "list" || value === "grid") {
              setContextListShow(value);
            }
          }}
        >
          <ToggleGroupItem value="list" aria-label="list">
            <Icon icon="lucide:list" className="h-5 w-5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="grid">
            <Icon icon="lucide:grid-2x2" className="h-5 w-5" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div
        className={`grid gap-4 ${contextListShow === "list" ? "grid-cols-1" : "grid-cols-2"}`}
      >
        {visibleItems.map((item) => {
          const itemKey =
            item.link !== "#" ? item.link : `${item.title}-${item.pubDate}`;

          return (
            <a
              key={itemKey}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="group min-h-20 w-full gap-4 rounded-lg p-4 border border-neutral-200/70 bg-white/80 shadow-[0_6px_30px_-18px_rgba(0,0,0,0.2)] backdrop-blur-sm dark:border-neutral-800/80 dark:bg-neutral-900/80 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center">
                <div className="relative size-12 md:size-16 flex-none overflow-hidden rounded-full">
                  {item.avatar ? (
                    <Image
                      src={item.avatar}
                      alt={item.name}
                      className="object-cover"
                      fill
                      loading="lazy"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-200 text-lg font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">{item.title}</h3>
                  <div className="mt-1 text-sm text-gray-500">
                    {new Date(item.pubDate).toLocaleString("zh-CN", {})}
                  </div>
                </div>
              </div>
              <div className="ml-16 md:ml-20 mt-1 text-sm text-gray-800 dark:text-gray-200">
                {item.description}
              </div>
            </a>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            disabled={safePage <= 1}
            onClick={() => updatePage(safePage - 1)}
          >
            <Icon icon="ph:arrow-left" className="h-4 w-4" />
            上一页
          </Button>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            第 {safePage} / {totalPages} 页
          </span>
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            disabled={safePage >= totalPages}
            onClick={() => updatePage(safePage + 1)}
          >
            下一页
            <Icon icon="ph:arrow-right" className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
