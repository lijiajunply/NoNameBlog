import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SeparatorProps = HTMLAttributes<HTMLHRElement> & {
  orientation?: "horizontal" | "vertical";
};

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorProps) {
  return (
    <hr
      className={cn(
        "border-neutral-200 dark:border-neutral-800",
        orientation === "horizontal" && "w-full border-t",
        orientation === "vertical" && "h-full border-l",
        className,
      )}
      {...props}
    />
  );
}
