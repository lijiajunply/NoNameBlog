"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type FigureProps = ComponentPropsWithoutRef<"figure">;

export function CodeBlockFigure({
  className,
  children,
  ...props
}: FigureProps) {
  const figureRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

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
      {children}
      <button
        type="button"
        className="code-copy-button absolute top-3 right-3 z-20 rounded-md border border-black/10 bg-white/85 px-2 py-1 text-xs font-medium text-neutral-700 opacity-0 shadow-sm transition-all hover:bg-white hover:text-neutral-900 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 group-hover:opacity-100 dark:border-white/10 dark:bg-neutral-900/85 dark:text-neutral-200 dark:hover:bg-neutral-900 dark:hover:text-white dark:focus-visible:ring-neutral-500"
        onClick={copyCode}
        aria-label={copied ? "已复制代码" : "复制代码"}
      >
        {copied ? "已复制" : "复制"}
      </button>
    </figure>
  );
}
