"use client";

import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Heading = {
  depth: 1 | 2 | 3;
  text: string;
  id: string;
};

export function PostToc({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>("");
  const headingIds = useMemo(() => headings.map((item) => item.id), [headings]);

  const handleTocClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();

    const target = document.getElementById(id);
    if (!target) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const offset = 96;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;

    window.history.pushState(null, "", `#${id}`);
    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
    setActiveId(id);
  };

  useEffect(() => {
    if (!headingIds.length) {
      return;
    }

    let frameId = 0;

    const resolveActiveHeading = () => {
      const elements = headingIds
        .map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => Boolean(element));

      if (!elements.length) {
        setActiveId("");
        return;
      }

      const offset = 120;
      let currentId = elements[0].id;

      for (const element of elements) {
        if (element.getBoundingClientRect().top <= offset) {
          currentId = element.id;
        } else {
          break;
        }
      }

      setActiveId(currentId);
    };

    const onScroll = () => {
      if (frameId !== 0) {
        return;
      }
      frameId = window.requestAnimationFrame(() => {
        resolveActiveHeading();
        frameId = 0;
      });
    };

    resolveActiveHeading();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("hashchange", resolveActiveHeading);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("hashchange", resolveActiveHeading);
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [headingIds]);

  if (!headings.length) {
    return null;
  }

  return (
    <aside className="sticky top-24 hidden max-h-[70vh] overflow-y-auto rounded-2xl border border-neutral-200/70 bg-white/80 p-4 backdrop-blur-xl lg:block dark:border-neutral-800/70 dark:bg-neutral-900/80">
      <h3 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        目录
      </h3>
      <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
        {headings.map((item) => (
          <li key={item.id}>
            <a
              className={cn(
                "block rounded-md px-2 py-1 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white",
                item.id === activeId &&
                  "bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-white",
                item.depth === 2 &&
                  "ml-3 text-neutral-500 dark:text-neutral-400",
                item.depth === 3 &&
                  "ml-6 text-neutral-500 dark:text-neutral-400",
              )}
              href={`#${item.id}`}
              onClick={(event) => handleTocClick(event, item.id)}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
