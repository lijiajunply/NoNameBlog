import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Post } from "@/lib/content/posts";
import { formatDate } from "@/lib/utils";

export function PostCard({ post }: { post: Post }) {
  const { category, tags, cover } = post.frontmatter;
  const summary = post.frontmatter.summary ?? undefined;

  return (
    <div className="group relative overflow-hidden rounded-[30px] min-h-60 border border-neutral-200/70 bg-white/80 shadow-[0_6px_30px_-18px_rgba(0,0,0,0.2)] backdrop-blur-sm dark:border-neutral-800/80 dark:bg-neutral-900/80">
      <div className="relative z-10 p-7">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span>{formatDate(post.frontmatter.date)}</span>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 transition-colors group-hover:text-neutral-600 dark:text-white dark:group-hover:text-neutral-300">
          <Link href={`/posts/${post.slug}`}>{post.frontmatter.title}</Link>
        </h2>
        {summary ? (
          <p className="mt-3 leading-7 text-neutral-600 dark:text-neutral-300">
            {summary}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          {category ? (
            <Link href={`/categories/${encodeURIComponent(category)}`}>
              <Badge className="transition-colors hover:border-neutral-300 hover:text-neutral-800 dark:hover:border-neutral-600 dark:hover:text-neutral-100">
                分类: {category}
              </Badge>
            </Link>
          ) : null}
          {tags.map((tag) => (
            <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>
              <Badge className="transition-colors hover:border-neutral-300 hover:text-neutral-800 dark:hover:border-neutral-600 dark:hover:text-neutral-100">
                #{tag}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
      {cover ? (
        <img
          src={cover}
          alt={post.frontmatter.title}
          className="absolute h-full object-cover top-0 right-0 aspect-video hidden lg:block backdrop-blur-lg"
          style={{
            opacity: 0.75,
          }}
          loading="lazy"
        />
      ) : null}
    </div>
  );
}
