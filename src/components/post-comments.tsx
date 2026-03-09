"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

const giscusConfig = {
  repo: process.env.NEXT_PUBLIC_GISCUS_REPO,
  repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID,
  category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY,
  categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
};

const isEnabled = Object.values(giscusConfig).every(Boolean);

function toGiscusTheme(theme: string | undefined) {
  return theme === "dark" ? "dark" : "light";
}

export function PostComments() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const giscusTheme = toGiscusTheme(resolvedTheme);

  useEffect(() => {
    if (!isEnabled || !containerRef.current) {
      return;
    }
    if (containerRef.current.childElementCount > 0) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", giscusConfig.repo as string);
    script.setAttribute("data-repo-id", giscusConfig.repoId as string);
    script.setAttribute("data-category", giscusConfig.category as string);
    script.setAttribute("data-category-id", giscusConfig.categoryId as string);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-theme", giscusTheme);
    script.setAttribute("data-loading", "lazy");

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);
  }, [giscusTheme]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const iframe = document.querySelector<HTMLIFrameElement>(
      "iframe.giscus-frame",
    );
    if (!iframe?.contentWindow) {
      return;
    }

    iframe.contentWindow.postMessage(
      {
        giscus: {
          setConfig: {
            theme: giscusTheme,
          },
        },
      },
      "https://giscus.app",
    );
  }, [giscusTheme]);

  if (!isEnabled) {
    return null;
  }

  return (
    <section className="mt-10 border-t border-neutral-200/70 pt-8 dark:border-neutral-800/80">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
        评论
      </h2>
      <div ref={containerRef} />
    </section>
  );
}
