"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChartFrameProps = {
  title?: string;
  className?: string;
  children: ReactNode;
};

export function ChartFrame({ title, className, children }: ChartFrameProps) {
  return (
    <section className="my-8">
      {title ? (
        <h4 className="mb-3 font-medium text-neutral-800 text-sm dark:text-neutral-200">
          {title}
        </h4>
      ) : null}
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-neutral-200/70 bg-neutral-50/80 p-3 dark:border-neutral-700/60 dark:bg-neutral-900/50",
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}

type ChartErrorCardProps = {
  title?: string;
  message: string;
};

export function ChartErrorCard({ title, message }: ChartErrorCardProps) {
  return (
    <ChartFrame title={title}>
      <div className="rounded-xl border border-rose-300/70 bg-rose-50/70 p-4 text-rose-800 text-sm dark:border-rose-700/70 dark:bg-rose-950/30 dark:text-rose-200">
        <p className="font-medium">Chart Render Error</p>
        <p className="mt-1 break-words font-mono text-xs leading-relaxed">
          {message}
        </p>
      </div>
    </ChartFrame>
  );
}
