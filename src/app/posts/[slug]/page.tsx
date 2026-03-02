import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostToc } from "@/components/post-toc";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { renderMdx } from "@/lib/content/mdx";
import { getAllPosts, getPostBySlug } from "@/lib/content/posts";
import { formatDate } from "@/lib/utils";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.summary,
    alternates: {
      canonical: `${siteConfig.siteUrl}/posts/${post.slug}/`,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const content = await renderMdx(post.content);
  const { category, tags } = post.frontmatter;

  return (
    <article className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
      <section className="rounded-3xl border border-neutral-200/70 bg-white/75 p-7 md:p-10 dark:border-neutral-800/80 dark:bg-neutral-900/75">
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            <span>{formatDate(post.frontmatter.date)}</span>
            <span>·</span>
            <span>{post.readingTime}</span>
          </div>
          <h1
            className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl dark:text-white"
            data-pagefind-meta="title"
          >
            {post.frontmatter.title}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            {post.frontmatter.summary}
          </p>
          <div className="flex flex-wrap gap-2">
            {category ? (
              <Link href={`/categories/${encodeURIComponent(category)}`}>
                <Badge>分类: {category}</Badge>
              </Link>
            ) : null}
            {tags.map((tag) => (
              <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>
                <Badge>#{tag}</Badge>
              </Link>
            ))}
          </div>
        </div>
        <div
          className="prose prose-neutral max-w-none dark:prose-invert"
          data-pagefind-body
        >
          {content}
        </div>
      </section>
      <PostToc headings={post.headings} />
    </article>
  );
}
