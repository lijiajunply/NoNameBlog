"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type InfographicDiagramProps = {
  syntax?: string;
  children?: ReactNode;
  className?: string;
};

function normalizeSyntaxInput(input: InfographicDiagramProps): string {
  if (typeof input.syntax === "string") {
    return input.syntax.trim();
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

export function InfographicDiagram(props: InfographicDiagramProps) {
  const syntax = useMemo(() => normalizeSyntaxInput(props), [props]);
  const containerRef = useRef<HTMLDivElement>(null);
  const infographicRef = useRef<import("@antv/infographic").Infographic | null>(
    null,
  );
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!syntax) {
      setError("Infographic 内容为空");
      setIsReady(false);
      infographicRef.current?.destroy();
      infographicRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      return;
    }

    let cancelled = false;

    const renderInfographic = async () => {
      if (!containerRef.current) {
        return;
      }

      try {
        setError("");
        setIsReady(false);

        const { Infographic } = await import("@antv/infographic");
        if (cancelled || !containerRef.current) {
          return;
        }

        infographicRef.current?.destroy();
        infographicRef.current = null;
        containerRef.current.innerHTML = "";

        const instance = new Infographic({
          container: containerRef.current,
          width: "100%",
        });

        instance.render(syntax);

        if (cancelled) {
          instance.destroy();
          return;
        }

        infographicRef.current = instance;
        setIsReady(true);
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        infographicRef.current?.destroy();
        infographicRef.current = null;
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
        setIsReady(false);
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Infographic 渲染失败",
        );
      }
    };

    void renderInfographic();

    return () => {
      cancelled = true;
      infographicRef.current?.destroy();
      infographicRef.current = null;
    };
  }, [syntax]);

  return (
    <figure
      className={cn(
        "my-8 overflow-hidden rounded-[28px] bg-gray-50/70 dark:bg-gray-950/20",
        props.className,
      )}
    >
      {!isReady && !error ? (
        <div className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
          Infographic 加载中...
        </div>
      ) : null}

      {error ? (
        <div className="border-b border-red-200/70 bg-red-50/70 px-5 py-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto py-5">
        <div
          ref={containerRef}
          className={cn(
            "mx-auto min-h-24 min-w-[320px] rounded-[28px]! p-4",
            !isReady && !error ? "opacity-70" : "",
          )}
        />
      </div>
    </figure>
  );
}
