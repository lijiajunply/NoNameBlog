import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200/70 bg-white/80 p-6 shadow-[0_6px_30px_-18px_rgba(0,0,0,0.2)] backdrop-blur-sm dark:border-neutral-800/80 dark:bg-neutral-900/80",
        className,
      )}
      {...props}
    />
  );
}
