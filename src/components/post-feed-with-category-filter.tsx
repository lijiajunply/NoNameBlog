"use client";

import { Icon } from "@iconify/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PostSummary } from "@/types/content";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

type PostFeedWithCategoryFilterProps = {
  posts: PostSummary[];
  postsPerPage?: number;
  initialCategory?: string;
  initialPage?: number;
  emptyText?: string;
  routeBase?: string;
};

export function PostFeedWithCategoryFilter({
  posts,
  postsPerPage = 8,
  initialCategory = "all",
  initialPage = 1,
  emptyText = "当前分类下暂无文章。",
  routeBase = "",
}: PostFeedWithCategoryFilterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [contextListShow, setContextListShow] = useState<"list" | "grid">(() =>
    typeof window !== "undefined" && window.innerWidth < 1024 ? "list" : "grid",
  );
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleResize = () => {
      setContextListShow(window.innerWidth < 1024 ? "list" : "grid");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const allPosts = posts;

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const post of allPosts) {
      const category = post.frontmatter.category;
      if (category) {
        map.set(category, (map.get(category) ?? 0) + 1);
      }
    }

    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .toSorted((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [allPosts]);

  const activeCategory = categories.some(
    (category) => category.name === selectedCategory,
  )
    ? selectedCategory
    : "all";

  const filteredPosts = useMemo(() => {
    if (activeCategory === "all") {
      return allPosts;
    }
    return allPosts.filter(
      (post) => post.frontmatter.category === activeCategory,
    );
  }, [activeCategory, allPosts]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPosts.length / postsPerPage),
  );
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * postsPerPage;
  const visiblePosts = filteredPosts.slice(start, start + postsPerPage);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const categoryFromQuery = params.get("category");
      const pageFromQuery = Number.parseInt(params.get("p") ?? "1", 10);
      const categoryExists = categories.some(
        (category) => category.name === categoryFromQuery,
      );

      setSelectedCategory(
        categoryFromQuery && categoryExists ? categoryFromQuery : "all",
      );
      setCurrentPage(
        Number.isNaN(pageFromQuery) || pageFromQuery < 1 ? 1 : pageFromQuery,
      );
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [categories]);

  const buildHref = (category: string, page: number) => {
    const params = new URLSearchParams();
    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    if (page <= 1) {
      params.delete("p");
    } else {
      params.set("p", String(page));
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const updateView = (category: string, page: number) => {
    setSelectedCategory(category);
    setCurrentPage(page);
    router.replace(buildHref(category, page), { scroll: false });
  };

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams();
    if (activeCategory !== "all") {
      params.set("category", activeCategory);
    }
    if (safePage > 1) {
      params.set("p", String(safePage));
    }

    const currentHref = `${window.location.pathname}${window.location.search}`;
    const query = params.toString();
    const canonicalHref = query ? `${pathname}?${query}` : pathname;

    if (currentHref !== canonicalHref) {
      router.replace(canonicalHref, { scroll: false });
    }
  }, [activeCategory, safePage, router, pathname]);

  const activeLabel = activeCategory === "all" ? "全部分类" : activeCategory;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            <Icon icon="ph:article-duotone" className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            最新文章
          </h2>
        </div>
        <div className="flex gap-2">
          <ToggleGroup
            variant="outline"
            type="single"
            size="sm"
            value={contextListShow}
            onValueChange={(value) =>
              setContextListShow(value as "list" | "grid")
            }
          >
            <ToggleGroupItem value="list" aria-label="list">
              <Icon icon="lucide:list" className="h-5 w-5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="grid">
              <Icon icon="lucide:grid-2x2" className="h-5 w-5" />
            </ToggleGroupItem>
          </ToggleGroup>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-xl border border-black/5 bg-white/70 px-3 text-sm text-neutral-700 hover:bg-white dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                <Icon icon="ph:funnel-duotone" className="h-4 w-4" />
                {activeLabel}
                <Icon icon="ph:caret-down-bold" className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>筛选分类</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={activeCategory}
                onValueChange={(value) => updateView(value, 1)}
              >
                <DropdownMenuRadioItem value="all">
                  全部 ({allPosts.length})
                </DropdownMenuRadioItem>
                {categories.map((category) => (
                  <DropdownMenuRadioItem
                    key={category.name}
                    value={category.name}
                  >
                    {category.name} ({category.count})
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {visiblePosts.length > 0 ? (
        <div
          className={`grid gap-6 ${contextListShow === "list" ? "grid-cols-1" : "grid-cols-2"}`}
        >
          {visiblePosts.map((post) => (
            <div
              key={post.slug}
              className="transition-transform duration-300 hover:-translate-y-1 h-full"
            >
              <PostCard post={post} routeBase={routeBase} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-neutral-300/80 bg-white/60 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-400">
          {emptyText}
        </div>
      )}

      {visiblePosts.length > 0 ? (
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            disabled={safePage <= 1}
            onClick={() => updateView(activeCategory, safePage - 1)}
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
            onClick={() => updateView(activeCategory, safePage + 1)}
          >
            下一页
            <Icon icon="ph:arrow-right" className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
