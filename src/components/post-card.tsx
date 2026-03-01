import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Post } from "@/lib/content/posts";
import { formatDate } from "@/lib/utils";

export function PostCard({ post }: { post: Post }) {
  return (
    <Card className="group p-6 md:p-7">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        <span>{formatDate(post.frontmatter.date)}</span>
        <span>·</span>
        <span>{post.readingTime}</span>
        <Badge>{post.frontmatter.category}</Badge>
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-neutral-900 transition-colors group-hover:text-neutral-600 dark:text-white dark:group-hover:text-neutral-300">
        <Link href={`/posts/${post.slug}`}>{post.frontmatter.title}</Link>
      </h2>
      <p className="mt-3 leading-7 text-neutral-600 dark:text-neutral-300">
        {post.frontmatter.summary}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {post.frontmatter.tags.map((tag) => (
          <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>
            <Badge className="transition-colors hover:border-neutral-300 hover:text-neutral-800 dark:hover:border-neutral-600 dark:hover:text-neutral-100">
              #{tag}
            </Badge>
          </Link>
        ))}
      </div>
    </Card>
  );
}
