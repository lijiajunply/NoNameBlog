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
        const isDark = resolvedTheme === "dark";

        // Apple Style Constants
        const appleBlue = isDark ? "#0A84FF" : "#007AFF";
        const bgPrimary = isDark
          ? "rgba(28, 28, 30, 0.65)"
          : "rgba(255, 255, 255, 0.75)";
        const bgCluster = isDark
          ? "rgba(44, 44, 46, 0.4)"
          : "rgba(242, 242, 247, 0.5)";
        const borderPrimary = isDark
          ? "rgba(255, 255, 255, 0.15)"
          : "rgba(0, 0, 0, 0.1)";
        const textPrimary = isDark ? "#F5F5F7" : "#1D1D1F";

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "base",
          themeVariables: {
            fontFamily:
              "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
            primaryColor: bgPrimary,
            primaryTextColor: textPrimary,
            primaryBorderColor: borderPrimary,
            lineColor: appleBlue,
            secondaryColor: isDark ? "#3A3A3C" : "#E5E5EA",
            tertiaryColor: bgCluster,
            background: "transparent",
            nodeBorder: borderPrimary,
            clusterBkg: bgCluster,
            clusterBorder: borderPrimary,
            defaultLinkColor: appleBlue,
            titleColor: textPrimary,
            edgeLabelBackground: isDark ? "#1C1C1E" : "#FFFFFF",
            nodeTextColor: textPrimary,
          },
          flowchart: {
            htmlLabels: true,
            curve: "basis",
            nodeSpacing: 60,
            rankSpacing: 60,
          },
          sequence: {
            actorBkg: bgPrimary,
            actorBorder: borderPrimary,
            actorTextColor: textPrimary,
            actorLineColor: appleBlue,
            signalColor: appleBlue,
            signalTextColor: textPrimary,
            noteBkg: isDark
              ? "rgba(58, 58, 60, 0.8)"
              : "rgba(245, 245, 247, 0.8)",
            noteTextColor: textPrimary,
            noteBorder: borderPrimary,
          },
          themeCSS: `
            .node rect, .node circle, .node ellipse, .node polygon, .node path {
              rx: 16px;
              ry: 16px;
              filter: drop-shadow(0 4px 12px rgba(0, 0, 0, ${isDark ? "0.3" : "0.06"}));
              stroke-width: 1px;
            }
            .cluster rect {
              rx: 24px;
              ry: 24px;
              stroke-width: 1.5px;
            }
            .edgeLabel {
              border-radius: 8px;
              padding: 4px 8px;
            }
            .edgePath .path {
              stroke-width: 2px;
              opacity: 0.8;
            }
            .marker {
              fill: ${appleBlue};
            }
          `,
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
        "mermaid-diagram my-8 w-full overflow-x-auto rounded-2xl border border-black/5 bg-white/40 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-black/20 dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]",
        props.className,
      )}
    />
  );
}
