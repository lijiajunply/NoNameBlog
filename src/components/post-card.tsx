"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { PostSummary } from "@/types/content";

function normalizeRouteBase(routeBase: string) {
  if (!routeBase) {
    return "";
  }
  return routeBase.endsWith("/") ? routeBase.slice(0, -1) : routeBase;
}

export function PostCard({
  post,
  routeBase = "",
}: {
  post: PostSummary;
  routeBase?: string;
}) {
  const { cover } = post.frontmatter;
  const summary = post.frontmatter.summary ?? undefined;
  const base = normalizeRouteBase(routeBase);

  return (
    <Link href={`${base}/posts/${post.slug}`}>
      <div className="group relative overflow-hidden rounded-[30px] min-h-40 border border-neutral-200/70 bg-white/80 shadow-[0_6px_30px_-18px_rgba(0,0,0,0.2)] backdrop-blur-sm dark:border-neutral-800/80 dark:bg-neutral-900/80">
        <div className={`relative z-10 p-7 ${cover ? "lg:w-[60%]" : ""}`}>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <span>{formatDate(post.frontmatter.date)}</span>
            <span>·</span>
            <span>{post.readingTime}</span>
          </div>
          <h2 className="text-xl lg:truncate font-semibold tracking-tight text-neutral-900 transition-colors group-hover:text-neutral-600 dark:text-white dark:group-hover:text-neutral-300">
            {post.frontmatter.title}
          </h2>
          {summary ? (
            <p className="mt-3 leading-7 text-neutral-600 dark:text-neutral-300 lg:truncate">
              {summary}
            </p>
          ) : null}
        </div>
        {cover ? (
          <div
            className="absolute right-0 top-0 hidden h-full lg:block"
            style={{ width: "40%" }}
          >
            <Image
              src={cover}
              alt={post.frontmatter.title}
              className="h-full w-full object-cover backdrop-blur-lg"
              fill
              loading="lazy"
              unoptimized
              style={{ opacity: 0.75 }}
            />
          </div>
        ) : null}
      </div>
    </Link>
  );
}
