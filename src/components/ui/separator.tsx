import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Separator({
  className,
  ...props
}: HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      className={cn("border-neutral-200 dark:border-neutral-800", className)}
      {...props}
    />
  );
}
