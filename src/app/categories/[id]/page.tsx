import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { siteConfig } from "@/config/site";
import { getAllCategories, getPostsByCategory } from "@/lib/content/posts";

type CategoryPageProps = {
  params: Promise<{ id: string }>;
};

function decodeTaxonomyId(id: string) {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

export function generateStaticParams() {
  return getAllCategories().map((category) => ({
    id: category.name,
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const name = decodeTaxonomyId(id);

  return {
    title: `分类: ${name}`,
    alternates: {
      canonical: `${siteConfig.siteUrl}/categories/${encodeURIComponent(name)}/`,
    },
  };
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { id } = await params;
  const name = decodeTaxonomyId(id);
  const posts = getPostsByCategory(name);

  if (!posts.length) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        分类: {name}
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
