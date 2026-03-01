import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-neutral-200 bg-white/80 px-4 py-2.5 text-sm outline-none transition focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900",
        className,
      )}
      {...props}
    />
  );
}
