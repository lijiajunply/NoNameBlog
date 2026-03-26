"use client";

import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type TipProps = {
  children?: React.ReactNode;
  text?: string;
  tip?: string;
  tooltip?: string;
  message?: string;
  copy?: string | boolean;
  value?: string;
  className?: string;
};

export function Tip({
  children,
  text,
  tip,
  tooltip,
  message,
  copy,
  value,
  className,
}: TipProps) {
  const [copied, setCopied] = useState(false);

  const label = children ?? text ?? "";
  const normalizedLabel =
    typeof label === "string" ? label : typeof text === "string" ? text : "";
  const copyEnabled =
    copy === true || copy === "true" || copy === "" || Boolean(value);
  const copyValue =
    typeof value === "string" && value
      ? value
      : copyEnabled
        ? normalizedLabel
        : undefined;
  const tooltipText = tip ?? tooltip ?? message;

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 1600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  async function handleCopy() {
    if (!copyValue) {
      return;
    }

    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy tip content:", error);
    }
  }

  const content = (
    <span
      className={cn(
        "inline border-b border-dashed border-current/45 pb-[0.05em] font-medium text-neutral-700 transition-colors dark:text-neutral-300",
        copyValue
          ? "cursor-copy hover:text-neutral-950 dark:hover:text-neutral-50"
          : null,
        copied ? "text-emerald-700 dark:text-emerald-300" : null,
        className,
      )}
    >
      {label}
    </span>
  );

  if (!copyValue && !tooltipText) {
    return content;
  }

  const tooltipContent = copied
    ? "已复制"
    : [tooltipText, copyValue ? "点击复制" : null].filter(Boolean).join(" · ");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {copyValue ? (
            <button
              type="button"
              onClick={handleCopy}
              className="inline rounded-none border-0 bg-transparent p-0 text-left align-baseline"
            >
              {content}
            </button>
          ) : (
            <span>{content}</span>
          )}
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
