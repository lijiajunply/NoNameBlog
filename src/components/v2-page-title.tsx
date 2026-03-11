"use client";

import { ChevronRightIcon } from "lucide-react";
import { usePathname } from "next/navigation";

type PostMeta = {
  slug: string;
  title: string;
  category?: string;
};

type V2PageTitleProps = {
  posts: PostMeta[];
};

const staticLabels: Record<string, string> = {
  "/v2": "主页",
  "/v2/search": "搜索",
  "/v2/stats": "统计",
  "/v2/about": "关于",
  "/v2/friends": "友链",
  "/v2/write": "写作",
};

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function buildBreadcrumb(pathname: string, posts: PostMeta[]) {
  const normalizedPath = normalizePath(pathname);

  if (staticLabels[normalizedPath]) {
    return [staticLabels[normalizedPath]];
  }

  if (normalizedPath.startsWith("/v2/posts/")) {
    const slug = decodeSegment(normalizedPath.replace("/v2/posts/", ""));
    const post = posts.find((item) => item.slug === slug);

    const crumbs = ["文章"];
    if (post?.category) {
      crumbs.push(post.category);
    }
    crumbs.push(post?.title ?? slug);
    return crumbs;
  }

  if (normalizedPath.startsWith("/v2/categories/")) {
    const category = decodeSegment(
      normalizedPath.replace("/v2/categories/", ""),
    );
    return ["分类", category];
  }

  if (normalizedPath.startsWith("/v2/tags/")) {
    const tag = decodeSegment(normalizedPath.replace("/v2/tags/", ""));
    return ["标签", tag];
  }

  return ["当前页"];
}

export function V2PageTitle({ posts }: V2PageTitleProps) {
  const pathname = usePathname();
  const breadcrumbs = buildBreadcrumb(pathname, posts);
  const breadcrumbKeys = breadcrumbs.reduce<string[]>((acc, crumb) => {
    const previous = acc[acc.length - 1];
    acc.push(previous ? `${previous}>${crumb}` : crumb);
    return acc;
  }, []);

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden text-sm text-neutral-500 dark:text-neutral-300">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const key = breadcrumbKeys[index] ?? crumb;
        return (
          <div key={key} className="flex min-w-0 items-center gap-1">
            {index > 0 ? (
              <ChevronRightIcon className="size-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
            ) : null}
            <span
              className={
                isLast
                  ? "truncate font-semibold text-neutral-900 dark:text-neutral-100"
                  : "truncate"
              }
              title={crumb}
            >
              {crumb}
            </span>
          </div>
        );
      })}
    </div>
  );
}
