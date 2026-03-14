"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ZoomableImageProps = {
  src?: string;
  alt?: string;
  className?: string;
  [key: string]: any;
};

export function ZoomableImage({
  src,
  alt = "",
  className,
  ...props
}: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

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
            style={{ width: '75%' }}
            {...props}
          />
        </button>
        <div className="text-sm text-neutral-500 mt-2 text-center">
          {alt}
        </div>
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
