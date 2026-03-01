import { compileMDX } from "next-mdx-remote/rsc";
import type { ReactNode } from "react";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type MdxComponentProps = {
  className?: string;
  [key: string]: unknown;
};

type MdxComponent = (props: MdxComponentProps) => ReactNode;
type MdxComponents = Record<string, MdxComponent>;

const mdxComponents: MdxComponents = {
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "mt-10 mb-5 text-3xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-10 mb-4 text-2xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3 className={cn("mt-8 mb-3 text-xl font-medium", className)} {...props} />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn(
        "my-4 leading-8 text-neutral-700 dark:text-neutral-300",
        className,
      )}
      {...props}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-950 dark:decoration-neutral-600 dark:hover:text-white",
        className,
      )}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-6 border-l-2 border-neutral-300 pl-5 text-neutral-600 italic dark:border-neutral-700 dark:text-neutral-300",
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("my-4 ml-6 list-disc space-y-2", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("my-4 ml-6 list-decimal space-y-2", className)}
      {...props}
    />
  ),
  table: ({ className, ...props }) => (
    <div className="my-6 overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-left text-sm", className)}
        {...props}
      />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "border-b border-neutral-200 px-3 py-2 font-medium dark:border-neutral-700",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "border-b border-neutral-100 px-3 py-2 dark:border-neutral-800",
        className,
      )}
      {...props}
    />
  ),
};

const prettyCodeOptions = {
  theme: {
    dark: "github-dark",
    light: "github-light",
  },
  keepBackground: false,
};

export async function renderMdx(source: string) {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "append" }],
          [rehypePrettyCode, prettyCodeOptions],
        ],
      },
    },
  });

  return content;
}
