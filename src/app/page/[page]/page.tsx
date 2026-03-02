import { Icon } from "@iconify/react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { siteConfig } from "@/config/site";
import { getAllPosts } from "@/lib/content/posts";

const POSTS_PER_PAGE = 8;

type HomePaginationPageProps = {
  params: Promise<{ page: string }>;
};

function parsePageNumber(input: string) {
  const page = Number.parseInt(input, 10);
  if (Number.isNaN(page) || page < 2) {
    return null;
  }

  return page;
}

export function generateStaticParams() {
  const totalPages = Math.ceil(getAllPosts().length / POSTS_PER_PAGE);
  if (totalPages <= 1) {
    return [];
  }

  return Array.from({ length: totalPages - 1 }, (_, index) => ({
    page: String(index + 2),
  }));
}

export async function generateMetadata({
  params,
}: HomePaginationPageProps): Promise<Metadata> {
  const { page } = await params;
  const pageNumber = parsePageNumber(page);

  if (!pageNumber) {
    return {};
  }

  return {
    title: `最新文章 - 第 ${pageNumber} 页`,
    alternates: {
      canonical: `${siteConfig.siteUrl}/page/${pageNumber}/`,
    },
  };
}

export default async function HomePaginationPage({
  params,
}: HomePaginationPageProps) {
  const { page } = await params;
  const pageNumber = parsePageNumber(page);
  const posts = getAllPosts();
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

  if (!pageNumber || pageNumber > totalPages) {
    notFound();
  }

  const start = (pageNumber - 1) * POSTS_PER_PAGE;
  const pagedPosts = posts.slice(start, start + POSTS_PER_PAGE);
  const prevPageHref = pageNumber === 2 ? "/" : `/page/${pageNumber - 1}/`;
  const nextPageHref = `/page/${pageNumber + 1}/`;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          <Icon icon="ph:article-duotone" className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          最新文章
        </h1>
      </div>

      <div className="grid gap-5">
        {pagedPosts.map((post) => (
          <div
            key={post.slug}
            className="transition-transform duration-300 hover:-translate-y-1"
          >
            <PostCard post={post} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Link
          href={prevPageHref}
          className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <Icon icon="ph:arrow-left" className="h-4 w-4" />
          上一页
        </Link>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          第 {pageNumber} / {totalPages} 页
        </span>
        {pageNumber < totalPages ? (
          <Link
            href={nextPageHref}
            className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            下一页
            <Icon icon="ph:arrow-right" className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500">
            下一页
            <Icon icon="ph:arrow-right" className="h-4 w-4" />
          </span>
        )}
      </div>
    </section>
  );
}
