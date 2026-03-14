"use client";

import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_IMAGE_WIDTH = "75%";

type ZoomableImageProps = Omit<
  ComponentPropsWithoutRef<"img">,
  "src" | "alt" | "width" | "height" | "style"
> & {
  src?: string;
  alt?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  title?: string;
  style?: CSSProperties;
};

function normalizeCssLength(value: number | string | undefined) {
  if (typeof value === "number") {
    return `${value}px`;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  if (/^\d+(\.\d+)?$/.test(trimmedValue)) {
    return `${trimmedValue}px`;
  }

  return trimmedValue;
}

function parseDimensionMetadata(title?: string) {
  if (!title) {
    return {};
  }

  const metadata = title.matchAll(
    /\b(width|w|height|h)\s*[:=]\s*("(?:[^"]+)"|'(?:[^']+)'|[^,\s;]+)/gi,
  );
  const parsed: { width?: string; height?: string } = {};

  for (const [, rawKey, rawValue] of metadata) {
    const key = rawKey.toLowerCase();
    const cleanedValue = rawValue.replace(/^['"]|['"]$/g, "").trim();

    if (!cleanedValue) {
      continue;
    }

    if (key === "width" || key === "w") {
      parsed.width = cleanedValue;
    }

    if (key === "height" || key === "h") {
      parsed.height = cleanedValue;
    }
  }

  return parsed;
}

export function ZoomableImage({
  src,
  alt = "",
  className,
  width,
  height,
  title,
  style,
  ...props
}: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dimensionMetadata = parseDimensionMetadata(title);
  const imageStyle = {
    ...style,
    width:
      normalizeCssLength(width) ??
      normalizeCssLength(dimensionMetadata.width) ??
      style?.width ??
      DEFAULT_IMAGE_WIDTH,
    height:
      normalizeCssLength(height) ??
      normalizeCssLength(dimensionMetadata.height) ??
      style?.height,
  };
  const titleProp =
    title && !dimensionMetadata.width && !dimensionMetadata.height
      ? title
      : undefined;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (!src) {
    return null;
  }

  return (
    <>
      <div className="mb-4 mt-6">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-0 mb-0 w-full rounded-2xl flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
          aria-label="点击查看大图"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className={cn(
              "rounded-2xl border cursor-zoom-in border-neutral-200/50 shadow-sm dark:border-neutral-800/50 mt-0 mb-0",
              className,
            )}
            width={undefined}
            height={undefined}
            title={titleProp}
            style={imageStyle}
            {...props}
          />
        </button>
        {alt ? (
          <div className="text-sm text-neutral-500 mt-2 text-center">{alt}</div>
        ) : null}
      </div>

      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-label="关闭大图"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
          />
        </button>
      ) : null}
    </>
  );
}
