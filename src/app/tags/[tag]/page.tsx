import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { getAllTags, getPostsByTag } from "@/lib/content/posts";

type TagPageProps = {
  params: Promise<{ tag: string }>;
};

export function generateStaticParams() {
  return getAllTags().map((tag) => ({
    tag: tag.name,
  }));
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag}`,
    description: `标签 ${tag} 下的所有文章`,
  };
}

export default async function TagDetailPage({ params }: TagPageProps) {
  const { tag } = await params;
  const posts = getPostsByTag(tag);

  if (!posts.length) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        标签：#{tag}
      </h1>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
