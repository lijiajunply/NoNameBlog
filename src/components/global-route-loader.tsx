"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const INITIAL_PROGRESS = 8;
const MAX_PROGRESS = 92;
const MIN_VISIBLE_MS = 220;
const COMPLETE_DELAY_MS = 180;

function isInternalNavigationTarget(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute("href");
  if (!href) {
    return false;
  }

  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return false;
  }

  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return false;
  }

  const rel = anchor.getAttribute("rel");
  if (rel?.split(" ").includes("external")) {
    return false;
  }

  try {
    const targetUrl = new URL(anchor.href, window.location.href);
    if (targetUrl.origin !== window.location.origin) {
      return false;
    }

    const current =
      window.location.pathname + window.location.search + window.location.hash;
    const next = targetUrl.pathname + targetUrl.search + targetUrl.hash;
    return current !== next;
  } catch {
    return false;
  }
}

export function GlobalRouteLoader() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  const hasHydratedRef = useRef(false);
  const activeRef = useRef(false);
  const startedAtRef = useRef(0);
  const progressTimerRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (activeRef.current) {
      return;
    }

    clearTimers();
    startedAtRef.current = Date.now();
    setActive(true);
    setProgress(INITIAL_PROGRESS);

    progressTimerRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= MAX_PROGRESS) {
          return current;
        }
        const remaining = MAX_PROGRESS - current;
        return Math.min(MAX_PROGRESS, current + Math.max(1, remaining * 0.18));
      });
    }, 160);
  }, [clearTimers]);

  const complete = useCallback(() => {
    if (!activeRef.current) {
      return;
    }

    clearTimers();
    const elapsed = Date.now() - startedAtRef.current;
    const waitForMinVisible = Math.max(0, MIN_VISIBLE_MS - elapsed);

    finishTimerRef.current = window.setTimeout(() => {
      setProgress(100);
      hideTimerRef.current = window.setTimeout(() => {
        setActive(false);
        setProgress(0);
      }, COMPLETE_DELAY_MS);
    }, waitForMinVisible);
  }, [clearTimers]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) {
        return;
      }
      if (isInternalNavigationTarget(anchor)) start();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [start]);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }
    void pathname;
    complete();
  }, [pathname, complete]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-9999 h-0.5"
    >
      <div
        className="h-full origin-left transition-[transform,opacity] duration-200 ease-out bg-sky-600"
        style={{
          transform: `scaleX(${progress / 100})`,
          opacity: active ? 1 : 0,
        }}
      />
    </div>
  );
}
