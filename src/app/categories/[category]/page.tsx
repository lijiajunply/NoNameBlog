import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { getAllCategories, getPostsByCategory } from "@/lib/content/posts";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return getAllCategories().map((category) => ({
    category: category.name,
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  return {
    title: `${category} 分类`,
    description: `分类 ${category} 下的所有文章`,
  };
}

export default async function CategoryDetailPage({
  params,
}: CategoryPageProps) {
  const { category } = await params;
  const posts = getPostsByCategory(category);

  if (!posts.length) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        分类：{category}
      </h1>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
