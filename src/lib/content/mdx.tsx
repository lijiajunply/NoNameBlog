import { compileMDX } from "next-mdx-remote/rsc";
import { createElement, type ReactNode } from "react";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkMath from "remark-math";
import { Area, AreaChart } from "@/components/charts/area-chart";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { Chat } from "@/components/mdx/chat";
import { CodeBlockFigure } from "@/components/mdx/code-block-figure";
import { GitHubCalendarCard } from "@/components/mdx/github-calendar-card";
import { Icon } from "@/components/mdx/icon";
import { MermaidDiagram } from "@/components/mdx/mermaid-diagram";
import { ZoomableImage } from "@/components/mdx/zoomable-image";
import { Card } from "@/components/ui/card";
import { rehypeMermaid } from "@/lib/content/rehype-mermaid";
import { transformColonComponents } from "@/lib/content/remark-colon-components";
import { cn } from "@/lib/utils";

type MdxComponentProps = {
  className?: string;
  children?: ReactNode;
  [key: string]: any;
};

const YAML_PROP_PREFIX = "__YAML__";

function decodeYamlPropValue(value: unknown): unknown {
  if (typeof value !== "string" || !value.startsWith(YAML_PROP_PREFIX)) {
    return value;
  }

  try {
    return JSON.parse(decodeURIComponent(value.slice(YAML_PROP_PREFIX.length)));
  } catch {
    return value;
  }
}

function decodeYamlProps<T extends Record<string, any>>(props: T): T {
  const decodedEntries = Object.entries(props).map(([key, value]) => [
    key,
    decodeYamlPropValue(value),
  ]);
  return Object.fromEntries(decodedEntries) as T;
}

function withDecodedProps<T extends MdxComponentProps>(
  Component: (props: T) => ReactNode,
) {
  return (props: T) => createElement(Component, decodeYamlProps(props));
}

const mdxComponents: Record<string, any> = {
  h1: ({ className, children, ...props }: MdxComponentProps) => (
    <h1
      className={cn(
        "mt-14 mb-8 text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ className, children, ...props }: MdxComponentProps) => (
    <h2
      className={cn(
        "mt-12 mb-6 text-2xl font-semibold tracking-tight text-neutral-800 dark:text-neutral-100",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ className, children, ...props }: MdxComponentProps) => (
    <h3
      className={cn(
        "mt-10 mb-5 text-xl font-medium tracking-tight text-neutral-800 dark:text-neutral-100",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ className, children, ...props }: MdxComponentProps) =>
    className?.includes("markdown-alert-title") ? (
      <p
        className={cn(
          "markdown-alert-title my-0 flex items-center gap-2 text-sm font-semibold leading-none text-neutral-800 dark:text-neutral-100",
          className,
        )}
        {...props}
      >
        {children}
      </p>
    ) : (
      <p
        className={cn(
          "my-6 leading-relaxed text-neutral-700 dark:text-neutral-300",
          className,
        )}
        {...props}
      >
        {children}
      </p>
    ),
  a: ({ className, children, ...props }: MdxComponentProps) => (
    <a
      className={cn(
        "font-medium text-neutral-900 underline decoration-neutral-300 decoration-2 underline-offset-4 transition-colors hover:text-neutral-600 dark:text-white dark:decoration-neutral-600 dark:hover:text-neutral-300",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ className, children, ...props }: MdxComponentProps) => (
    <blockquote
      className={cn(
        "my-8 relative overflow-hidden rounded-2xl bg-neutral-100/50 px-8 py-5 dark:bg-neutral-800/30",
        className,
      )}
      {...props}
    >
      <div className="text-neutral-600 leading-relaxed dark:text-neutral-400">
        {children}
      </div>
    </blockquote>
  ),
  ul: ({ className, children, ...props }: MdxComponentProps) => (
    <ul
      className={cn(
        "my-6 ml-6 list-disc space-y-3 marker:text-neutral-400 dark:marker:text-neutral-600",
        className,
      )}
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ className, children, ...props }: MdxComponentProps) => (
    <ol
      className={cn(
        "my-6 ml-6 list-decimal space-y-3 marker:text-neutral-500 dark:marker:text-neutral-500",
        className,
      )}
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ className, children, ...props }: MdxComponentProps) => (
    <li
      className={cn(
        "pl-2 text-neutral-700 dark:text-neutral-300 leading-relaxed",
        className,
      )}
      {...props}
    >
      {children}
    </li>
  ),
  img: ({ className, alt, ...props }: MdxComponentProps) => (
    <ZoomableImage className={className} alt={alt} {...props} />
  ),
  code: ({ className, children, ...props }: MdxComponentProps) => {
    // If it's a code block (inside pre), do not add custom styles here. They are handled by rehype-pretty-code
    return (
      <code
        className={cn(
          "relative rounded-md px-[0.4rem] py-[0.2rem] font-mono text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ className, children, ...props }: MdxComponentProps) => (
    <pre
      className={cn("mb-6 mt-6 overflow-x-auto rounded-xl py-4", className)}
      {...props}
    >
      {children}
    </pre>
  ),
  figure: ({ className, children, ...props }: MdxComponentProps) =>
    "data-rehype-pretty-code-figure" in props ? (
      <CodeBlockFigure className={className} {...props}>
        {children}
      </CodeBlockFigure>
    ) : (
      <figure className={className} {...props}>
        {children}
      </figure>
    ),
  AreaChart: withDecodedProps(AreaChart),
  Area: withDecodedProps(Area),
  Grid: withDecodedProps(Grid),
  ChartTooltip: withDecodedProps(ChartTooltip),
  XAxis: withDecodedProps(XAxis),
  Icon: withDecodedProps(Icon),
  GitHubCalendarCard: withDecodedProps(GitHubCalendarCard),
  MermaidDiagram: withDecodedProps(MermaidDiagram),
  Card: withDecodedProps(Card),
  Chat: withDecodedProps(Chat),
};

const prettyCodeOptions = {
  theme: {
    dark: "github-dark",
    light: "github-light",
  },
  keepBackground: true,
};

export async function renderMdx(source: string) {
  const transformedSource = transformColonComponents(source);

  const { content } = await compileMDX({
    source: transformedSource,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkAlert, remarkMath],
        rehypePlugins: [
          rehypeSlug,
          rehypeKatex,
          rehypeMermaid,
          [rehypeAutolinkHeadings, { behavior: "append" }],
          [rehypePrettyCode, prettyCodeOptions],
        ],
      },
    },
  });

  return content;
}
