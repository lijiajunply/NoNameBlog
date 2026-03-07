"use client";

import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type MermaidDiagramProps = {
  chart?: string;
  children?: ReactNode;
  className?: string;
};

function normalizeChartInput(input: MermaidDiagramProps): string {
  if (typeof input.chart === "string") {
    return input.chart.trim();
  }

  if (typeof input.children === "string") {
    return input.children.trim();
  }

  if (Array.isArray(input.children)) {
    return input.children
      .map((part) => (typeof part === "string" ? part : ""))
      .join("")
      .trim();
  }

  return "";
}

export function MermaidDiagram(props: MermaidDiagramProps) {
  const chart = useMemo(() => normalizeChartInput(props), [props]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!chart) {
      setSvg("");
      setError("图表内容为空");
      return;
    }

    let cancelled = false;

    const renderDiagram = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: resolvedTheme === "dark" ? "dark" : "default",
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
        const rendered = await mermaid.render(id, chart);

        if (!cancelled) {
          setSvg(rendered.svg);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setSvg("");
          setError(err instanceof Error ? err.message : "Mermaid 渲染失败");
        }
      }
    };

    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, resolvedTheme]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    containerRef.current.innerHTML = svg;
  }, [svg]);

  if (error) {
    return (
      <figure
        className={cn(
          "my-6 rounded-xl border border-red-200/70 bg-red-50/60 p-4 text-sm dark:border-red-900/40 dark:bg-red-950/20",
          props.className,
        )}
      >
        <figcaption className="font-medium text-red-700 dark:text-red-300">
          Mermaid 解析失败
        </figcaption>
        <pre className="mt-2 overflow-x-auto text-red-700/90 dark:text-red-200/90">
          <code>{error}</code>
        </pre>
      </figure>
    );
  }

  if (!svg) {
    return (
      <div
        className={cn(
          "my-6 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400",
          props.className,
        )}
      >
        Mermaid 图表加载中...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "mermaid-diagram my-6 overflow-x-auto rounded-xl border border-neutral-200/80 bg-white/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/50",
        props.className,
      )}
    />
  );
}
