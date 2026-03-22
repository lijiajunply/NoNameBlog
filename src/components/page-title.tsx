"use client";

import { ChevronRightIcon, HomeIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { BreadcrumbPostMeta } from "@/types/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type PageTitleProps = {
  posts: BreadcrumbPostMeta[];
  categories?: { name: string; count: number }[];
  tags?: { name: string; count: number }[];
  routeBase?: string;
};

type CrumbOption = {
  label: string;
  href: string;
};

type CrumbItem = {
  label: string;
  href?: string;
  children?: CrumbOption[];
};

function normalizeRouteBase(routeBase: string) {
  if (!routeBase || routeBase === "/") {
    return "";
  }

  return routeBase.endsWith("/") ? routeBase.slice(0, -1) : routeBase;
}

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

function buildBreadcrumb(
  pathname: string,
  posts: BreadcrumbPostMeta[],
  categories: { name: string; count: number }[] = [],
  tags: { name: string; count: number }[] = [],
  routeBase: string,
): CrumbItem[] {
  const normalizedPath = normalizePath(pathname);
  const base = normalizeRouteBase(routeBase);

  const rootChildren: CrumbOption[] = [
    { label: "主页", href: `${base}/` },
    { label: "搜索", href: `${base}/search` },
    { label: "统计", href: `${base}/stats` },
    { label: "关于", href: `${base}/about` },
    { label: "友链", href: `${base}/friends` },
    { label: "写作", href: `${base}/write` },
    { label: "朋友圈", href: `${base}/moments` },
  ];

  const categoryOptions = categories.map((c) => ({
    label: c.name,
    href: `${base}/categories/${encodeURIComponent(c.name)}`,
  }));

  const tagOptions = tags.map((t) => ({
    label: t.name,
    href: `${base}/tags/${encodeURIComponent(t.name)}`,
  }));

  const staticLabels: Record<string, string> = {
    [base || "/"]: "主页",
    [`${base}/search`]: "搜索",
    [`${base}/stats`]: "统计",
    [`${base}/about`]: "关于",
    [`${base}/friends`]: "友链",
    [`${base}/write`]: "写作",
    [`${base}/moments`]: "朋友圈",
  };
  const postsPrefix = `${base}/posts/`;
  const categoriesPrefix = `${base}/categories/`;
  const tagsPrefix = `${base}/tags/`;

  if (normalizedPath === base || normalizedPath === "") {
    return [
      { label: "__HOME__", href: base || "/", children: rootChildren },
      { label: "主页", href: base || "/" },
    ];
  }

  if (staticLabels[normalizedPath]) {
    return [
      { label: "__HOME__", href: base || "/", children: rootChildren },
      { label: staticLabels[normalizedPath], href: normalizedPath },
    ];
  }

  if (normalizedPath.startsWith(postsPrefix)) {
    const slug = decodeSegment(normalizedPath.replace(postsPrefix, ""));
    const post = posts.find((item) => item.slug === slug);

    const crumbs: CrumbItem[] = [
      { label: "__HOME__", href: base || "/", children: rootChildren },
      { label: "文章", href: base || "/", children: categoryOptions },
    ];

    if (post?.category) {
      const titleOptions = posts
        .filter((p) => p.category === post.category)
        .map((p) => ({
          label: p.title || p.slug,
          href: `${base}/posts/${p.slug}`,
        }));

      crumbs.push({
        label: post.category,
        href: `${base}/categories/${encodeURIComponent(post.category)}`,
        children: titleOptions,
      });
    }

    crumbs.push({
      label: post?.title ?? slug,
      href: `${base}/posts/${slug}`,
    });
    return crumbs;
  }

  if (normalizedPath.startsWith(categoriesPrefix)) {
    const category = decodeSegment(
      normalizedPath.replace(categoriesPrefix, ""),
    );
    const titleOptions = posts
      .filter((p) => p.category === category)
      .map((p) => ({
        label: p.title || p.slug,
        href: `${base}/posts/${p.slug}`,
      }));

    return [
      { label: "__HOME__", href: base || "/", children: rootChildren },
      { label: "分类", href: base || "/", children: categoryOptions },
      {
        label: category,
        href: `${base}/categories/${encodeURIComponent(category)}`,
        children: titleOptions,
      },
    ];
  }

  if (normalizedPath.startsWith(tagsPrefix)) {
    const tag = decodeSegment(normalizedPath.replace(tagsPrefix, ""));
    return [
      { label: "__HOME__", href: base || "/", children: rootChildren },
      { label: "标签", href: base || "/", children: tagOptions },
      {
        label: tag,
        href: `${base}/tags/${encodeURIComponent(tag)}`,
      },
    ];
  }

  return [
    { label: "__HOME__", href: base || "/", children: rootChildren },
    { label: "当前页", href: normalizedPath },
  ];
}

export function PageTitle({
  posts,
  categories = [],
  tags = [],
  routeBase = "",
}: PageTitleProps) {
  const pathname = usePathname();
  const breadcrumbs = buildBreadcrumb(
    pathname,
    posts,
    categories,
    tags,
    routeBase,
  );
  const breadcrumbKeys = breadcrumbs.reduce<string[]>((acc, crumb) => {
    const previous = acc[acc.length - 1];
    acc.push(previous ? `${previous}>${crumb.label}` : crumb.label);
    return acc;
  }, []);

  return (
    <div className="flex min-w-0 items-center gap-0.5 overflow-hidden text-sm text-neutral-500 dark:text-neutral-300">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const key = breadcrumbKeys[index] ?? crumb.label;
        const hasChildren = crumb.children && crumb.children.length > 0;

        const displayLabel =
          crumb.label === "__HOME__" ? (
            <HomeIcon className="size-4" />
          ) : (
            crumb.label
          );

        return (
          <div key={key} className="flex min-w-0 items-center gap-0.5">
            <div className="flex items-center min-w-0">
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className={cn(
                    "truncate hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors px-1.5 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    isLast &&
                      "font-semibold text-neutral-900 dark:text-neutral-100",
                  )}
                  title={crumb.label !== "__HOME__" ? crumb.label : "主页"}
                >
                  {displayLabel}
                </Link>
              ) : (
                <span
                  className={cn(
                    "truncate px-1.5 py-1",
                    isLast &&
                      "font-semibold text-neutral-900 dark:text-neutral-100",
                  )}
                  title={crumb.label !== "__HOME__" ? crumb.label : "主页"}
                >
                  {displayLabel}
                </span>
              )}
            </div>

            {!isLast || hasChildren ? (
              hasChildren ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="flex items-center justify-center p-0.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 dark:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700 data-[state=open]:bg-neutral-200 dark:data-[state=open]:bg-neutral-800"
                    title="显示其他选项"
                  >
                    <ChevronRightIcon className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="max-w-[300px] max-h-[300px]"
                  >
                    {crumb.children?.map((opt) => (
                      <DropdownMenuItem
                        key={opt.href}
                        asChild
                        className={cn(
                          "w-full cursor-pointer truncate",
                          opt.href === pathname &&
                            "font-medium text-sky-600 dark:text-sky-400",
                        )}
                        title={opt.label}
                      >
                        <Link href={opt.href} className="w-full block">
                          {opt.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center justify-center p-0.5 text-neutral-400 dark:text-neutral-500">
                  <ChevronRightIcon className="size-4" />
                </div>
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
