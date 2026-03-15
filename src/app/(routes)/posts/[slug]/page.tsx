import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostComments } from "@/components/post-comments";
import { PostToc } from "@/components/post-toc";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { renderMdx } from "@/lib/content/mdx";
import { getAllPosts, getPostBySlug } from "@/lib/content/posts";
import { formatDate } from "@/lib/utils";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

type LinkDirection = "previous" | "next";

function hasPathByDirection(
  startSlug: string,
  targetSlug: string,
  postsBySlug: Map<string, ReturnType<typeof getAllPosts>[number]>,
  direction: LinkDirection,
) {
  const visited = new Set<string>();
  let cursor: string | undefined = startSlug;

  while (cursor && !visited.has(cursor)) {
    if (cursor === targetSlug) {
      return true;
    }
    visited.add(cursor);

    const post = postsBySlug.get(cursor);
    const linkedSlug =
      direction === "next"
        ? post?.frontmatter.next
        : post?.frontmatter.previous;
    cursor = linkedSlug && linkedSlug !== cursor ? linkedSlug : undefined;
  }

  return false;
}

function pickFallbackPost(
  posts: ReturnType<typeof getAllPosts>,
  currentIndex: number,
  currentSlug: string,
  postsBySlug: Map<string, ReturnType<typeof getAllPosts>[number]>,
  direction: LinkDirection,
) {
  const step = direction === "next" ? 1 : -1;
  let index = currentIndex + step;

  while (index >= 0 && index < posts.length) {
    const candidate = posts[index];
    const createsCycle = hasPathByDirection(
      candidate.slug,
      currentSlug,
      postsBySlug,
      direction,
    );
    if (!createsCycle) {
      return candidate;
    }
    index += step;
  }

  return null;
}

function resolveLinkedPost(
  linkedSlug: string | undefined,
  fallbackPost: ReturnType<typeof getAllPosts>[number] | null,
  currentSlug: string,
  postsBySlug: Map<string, ReturnType<typeof getAllPosts>[number]>,
  direction: LinkDirection,
) {
  if (!linkedSlug || linkedSlug === currentSlug) {
    return fallbackPost;
  }

  const linkedPost = postsBySlug.get(linkedSlug);
  if (!linkedPost) {
    return fallbackPost;
  }

  const createsCycle = hasPathByDirection(
    linkedPost.slug,
    currentSlug,
    postsBySlug,
    direction,
  );
  return createsCycle ? fallbackPost : linkedPost;
}

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

  const summary = post.frontmatter.summary ?? undefined;

  return {
    title: post.frontmatter.title,
    description: summary,
    keywords: post.frontmatter.tags,
    alternates: {
      canonical: `${siteConfig.siteUrl}/posts/${post.slug}/`,
    },
    openGraph: {
      type: "article",
      locale: siteConfig.locale,
      url: `${siteConfig.siteUrl}/posts/${post.slug}/`,
      title: post.frontmatter.title,
      description: summary,
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
      description: summary,
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
  const { category, cover, tags } = post.frontmatter;
  const summary = post.frontmatter.summary ?? undefined;
  const posts = getAllPosts();
  const postsBySlug = new Map(posts.map((item) => [item.slug, item]));
  const currentIndex = posts.findIndex((item) => item.slug === post.slug);
  const defaultPreviousPost =
    currentIndex >= 0
      ? pickFallbackPost(
        posts,
        currentIndex,
        post.slug,
        postsBySlug,
        "previous",
      )
      : null;
  const defaultNextPost =
    currentIndex >= 0
      ? pickFallbackPost(posts, currentIndex, post.slug, postsBySlug, "next")
      : null;
  const previousPost = resolveLinkedPost(
    post.frontmatter.previous,
    defaultPreviousPost,
    post.slug,
    postsBySlug,
    "previous",
  );
  const nextPost = resolveLinkedPost(
    post.frontmatter.next,
    defaultNextPost,
    post.slug,
    postsBySlug,
    "next",
  );
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.frontmatter.title,
    description: summary,
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
      <section className="min-w-0 md:p-10 lg:pl-14 xl:pl-20">
        {cover ? (
          <div className="mb-6">
            <figure className="relative overflow-hidden rounded-[28px] border border-neutral-200/80 dark:border-neutral-800">
              <div className="relative aspect-[16/7] w-full">
                <Image
                  src={cover}
                  alt={`${post.frontmatter.title} 封面`}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/35" />
                <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/95 md:left-6 md:top-5 md:text-4">
                  <span>{formatDate(post.frontmatter.date)}</span>
                  <span>·</span>
                  <span>{post.readingTime}</span>
                </div>
                <div className="absolute inset-x-4 bottom-4 md:inset-x-6 md:bottom-6">
                  <h1
                    className="line-clamp-2 text-3xl font-semibold tracking-tight text-white md:text-5xl"
                    data-pagefind-meta="title"
                  >
                    {post.frontmatter.title}
                  </h1>
                  {summary ? (
                    <p className="mt-4 text-lg text-neutral-400">
                      {summary}
                    </p>
                  ) : null}
                </div>
              </div>
            </figure>

          </div>
        ) : (
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
            {summary ? (
              <p className="text-neutral-600 dark:text-neutral-300">
                {summary}
              </p>
            ) : null}
          </div>
        )}
        <div className="mb-6 flex flex-wrap gap-2">
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
        <div
          className="prose prose-neutral min-w-0 max-w-none dark:prose-invert"
          data-pagefind-body
        >
          {content}
        </div>

        <div className="mt-16 mb-4 border border-neutral-200/80 p-4 rounded-lg dark:border-neutral-800 bg-gray-50/90 dark:bg-gray-900/60">
          <div className="font-semibold">许可协议</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            本文采用{" "}
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans"
              target="_black"
            >
              署名-非商业性使用-相同方式共享 4.0 国际
            </a>{" "}
            许可协议，转载请注明出处。
          </div>
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
