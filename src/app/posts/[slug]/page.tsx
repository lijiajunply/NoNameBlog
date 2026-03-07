import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostToc } from "@/components/post-toc";
import { PostComments } from "@/components/post-comments";
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
    keywords: post.frontmatter.tags,
    alternates: {
      canonical: `${siteConfig.siteUrl}/posts/${post.slug}/`,
    },
    openGraph: {
      type: "article",
      locale: siteConfig.locale,
      url: `${siteConfig.siteUrl}/posts/${post.slug}/`,
      title: post.frontmatter.title,
      description: post.frontmatter.summary,
      siteName: siteConfig.siteName,
      publishedTime: `${post.frontmatter.date}T00:00:00+08:00`,
      tags: post.frontmatter.tags,
      images: [
        {
          url: "/og-default.svg",
          width: 1200,
          height: 630,
          alt: post.frontmatter.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.frontmatter.title,
      description: post.frontmatter.summary,
      images: ["/og-default.svg"],
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
  const posts = getAllPosts();
  const currentIndex = posts.findIndex((item) => item.slug === post.slug);
  const previousPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost =
    currentIndex >= 0 && currentIndex < posts.length - 1
      ? posts[currentIndex + 1]
      : null;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.frontmatter.title,
    description: post.frontmatter.summary,
    author: {
      "@type": "Person",
      name: siteConfig.author,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.siteName,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.siteUrl}/posts/${post.slug}/`,
    },
    datePublished: `${post.frontmatter.date}T00:00:00+08:00`,
    dateModified: `${post.frontmatter.date}T00:00:00+08:00`,
    keywords: post.frontmatter.tags.join(", "),
  };

  return (
    <article
      className={`grid gap-8 ${post.headings.length > 0 ? "lg:grid-cols-[minmax(0,1fr)_240px]" : ""}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <section className="min-w-0 lg:rounded-3xl lg:border lg:border-neutral-200/70 lg:bg-white/75 md:p-10 lg:dark:border-neutral-800/80 lg:dark:bg-neutral-900/75">
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
          className="prose prose-neutral min-w-0 max-w-none dark:prose-invert"
          data-pagefind-body
        >
          {content}
        </div>
        {previousPost || nextPost ? (
          <nav
            className="mt-10 grid gap-3 sm:grid-cols-2"
            aria-label="文章导航"
          >
            {previousPost ? (
              <Link
                href={`/posts/${previousPost.slug}`}
                className="group rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-100/80 dark:border-neutral-800 dark:bg-neutral-950/60 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/70"
              >
                <p className="text-xs text-neutral-500">上一篇</p>
                <p className="mt-2 line-clamp-2 font-medium text-neutral-800 transition-colors group-hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-white">
                  {previousPost.frontmatter.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {nextPost ? (
              <Link
                href={`/posts/${nextPost.slug}`}
                className="group rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-4 text-right transition-colors hover:border-neutral-300 hover:bg-neutral-100/80 dark:border-neutral-800 dark:bg-neutral-950/60 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/70"
              >
                <p className="text-xs text-neutral-500">下一篇</p>
                <p className="mt-2 line-clamp-2 font-medium text-neutral-800 transition-colors group-hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-white">
                  {nextPost.frontmatter.title}
                </p>
              </Link>
            ) : null}
          </nav>
        ) : null}
        <PostComments />
      </section>
      {post.headings.length > 0 && <PostToc headings={post.headings} />}
    </article>
  );
}
