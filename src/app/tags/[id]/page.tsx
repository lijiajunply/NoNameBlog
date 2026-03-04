import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { siteConfig } from "@/config/site";
import { getAllTags, getPostsByTag } from "@/lib/content/posts";

type TagPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return getAllTags().map((tag) => ({
    id: tag.name,
  }));
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { id } = await params;
  const name = id;

  return {
    title: `标签: ${name}`,
    alternates: {
      canonical: `${siteConfig.siteUrl}/tags/${encodeURIComponent(name)}/`,
    },
  };
}

export default async function TagDetailPage({ params }: TagPageProps) {
  const { id } = await params;
  const name = id;
  const posts = getPostsByTag(name);

  if (!posts.length) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        标签: #{name}
      </h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        共 {posts.length} 篇文章
      </p>
      <div className="grid gap-5">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
