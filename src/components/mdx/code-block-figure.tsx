"use client";

import type { ComponentPropsWithoutRef } from "react";
import { Children, isValidElement, useCallback, useRef, useState } from "react";
import { Icon } from "@/components/mdx/icon";
import { cn } from "@/lib/utils";

type FigureProps = ComponentPropsWithoutRef<"figure">;

type LanguageMeta = {
  label: string;
  icon: string;
};

const DEFAULT_LANGUAGE_META: LanguageMeta = {
  label: "Plain Text",
  icon: "material-symbols:code-rounded",
};

const LANGUAGE_META: Record<string, LanguageMeta> = {
  bash: { label: "Bash", icon: "skill-icons:bash-dark" },
  c: { label: "C", icon: "skill-icons:c" },
  cpp: { label: "C++", icon: "skill-icons:cpp" },
  csharp: { label: "C#", icon: "skill-icons:cs" },
  css: { label: "CSS", icon: "skill-icons:css" },
  go: { label: "Go", icon: "skill-icons:golang" },
  html: { label: "HTML", icon: "skill-icons:html" },
  java: { label: "Java", icon: "skill-icons:java-dark" },
  javascript: { label: "JavaScript", icon: "skill-icons:javascript" },
  json: { label: "JSON", icon: "material-symbols:data-object-rounded" },
  jsx: { label: "JSX", icon: "skill-icons:react-dark" },
  kotlin: { label: "Kotlin", icon: "skill-icons:kotlin-dark" },
  markdown: { label: "Markdown", icon: "material-symbols:markdown" },
  mdx: { label: "MDX", icon: "simple-icons:mdx" },
  php: { label: "PHP", icon: "skill-icons:php-dark" },
  python: { label: "Python", icon: "skill-icons:python-dark" },
  rust: { label: "Rust", icon: "skill-icons:rust" },
  shell: { label: "Shell", icon: "skill-icons:bash-dark" },
  sql: { label: "SQL", icon: "material-symbols:database-rounded" },
  swift: { label: "Swift", icon: "skill-icons:swift" },
  toml: { label: "TOML", icon: "material-symbols:description-outline-rounded" },
  tsx: { label: "TSX", icon: "skill-icons:react-dark" },
  typescript: { label: "TypeScript", icon: "skill-icons:typescript" },
  xml: { label: "XML", icon: "material-symbols:data-object-rounded" },
  yaml: { label: "YAML", icon: "material-symbols:description-outline-rounded" },
};

const LANGUAGE_ALIASES: Record<string, string> = {
  "c#": "csharp",
  cc: "cpp",
  cs: "csharp",
  cxx: "cpp",
  js: "javascript",
  mdown: "markdown",
  md: "markdown",
  mts: "typescript",
  plaintext: "text",
  py: "python",
  rb: "ruby",
  rs: "rust",
  sh: "shell",
  text: "text",
  ts: "typescript",
  yml: "yaml",
};

function normalizeLanguage(value: string | null): string {
  if (!value) {
    return "text";
  }

  const lower = value.trim().toLowerCase();
  if (!lower) {
    return "text";
  }

  return LANGUAGE_ALIASES[lower] ?? lower;
}

function getLanguageMeta(value: string | null): LanguageMeta {
  const normalized = normalizeLanguage(value);
  if (normalized === "text") {
    return DEFAULT_LANGUAGE_META;
  }

  return (
    LANGUAGE_META[normalized] ?? {
      label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
      icon: DEFAULT_LANGUAGE_META.icon,
    }
  );
}

function extractLanguageFromChildren(
  node: ComponentPropsWithoutRef<"figure">["children"],
): string | null {
  for (const child of Children.toArray(node)) {
    if (!isValidElement(child)) {
      continue;
    }

    const props = child.props as Record<string, unknown>;
    const language = props["data-language"];
    if (typeof language === "string" && language.trim()) {
      return language;
    }

    const nested = extractLanguageFromChildren(
      props.children as ComponentPropsWithoutRef<"figure">["children"],
    );
    if (nested) {
      return nested;
    }
  }

  return null;
}

export function CodeBlockFigure({
  className,
  children,
  ...props
}: FigureProps) {
  const figureRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const language = extractLanguageFromChildren(children);
  const { label: languageLabel, icon: languageIcon } = getLanguageMeta(
    typeof language === "string" ? language : null,
  );

  const copyCode = useCallback(async () => {
    const codeText =
      figureRef.current?.querySelector("code")?.textContent ?? "";

    if (!codeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, []);

  return (
    <figure
      ref={figureRef}
      className={cn(className, "group relative")}
      {...props}
    >
      <span className="code-mac-dots" aria-hidden />
      <div className="code-toolbar">
        <button
          type="button"
          className="code-copy-button rounded-md border border-black/10 bg-white/85 px-2 py-1 text-xs font-medium text-neutral-700 opacity-0 transition-all hover:bg-white hover:text-neutral-900 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 group-hover:opacity-100 dark:border-white/10 dark:bg-neutral-900/85 dark:text-neutral-200 dark:hover:bg-neutral-900 dark:hover:text-white dark:focus-visible:ring-neutral-500"
          onClick={copyCode}
          aria-label={copied ? "已复制代码" : "复制代码"}
        >
          {copied ? "已复制" : "复制"}
        </button>
        <span className="code-language-badge">
          <Icon icon={languageIcon} width={14} aria-hidden />
          <span>{languageLabel}</span>
        </span>
      </div>
      {children}
    </figure>
  );
}
