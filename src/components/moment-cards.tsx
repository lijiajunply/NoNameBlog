"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { FriendFeedItem } from "@/types/rss";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

export function MomentsCard({ items }: { items: FriendFeedItem[] }) {
  const [contextListShow, setContextListShow] = useState<"list" | "grid">(() =>
    typeof window !== "undefined" && window.innerWidth < 1024 ? "list" : "grid",
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      setContextListShow(window.innerWidth < 1024 ? "list" : "grid");
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">朋友圈</h2>
        <ToggleGroup
          variant="outline"
          type="single"
          size="sm"
          value={contextListShow}
          onValueChange={(value) =>
            setContextListShow(value as "list" | "grid")
          }
        >
          <ToggleGroupItem value="list" aria-label="list">
            <Icon icon="lucide:list" className="h-5 w-5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="grid">
            <Icon icon="lucide:grid-2x2" className="h-5 w-5" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div
        className={`mt-4 grid gap-4 ${contextListShow === "list" ? "grid-cols-1" : "grid-cols-2"}`}
      >
        {items.map((item) => {
          const itemKey =
            item.link !== "#" ? item.link : `${item.title}-${item.pubDate}`;

          return (
            <a
              key={itemKey}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="min-h-20 w-full gap-4 rounded-lg border border-gray-200 p-4 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <div className="flex items-center">
                <div className="relative size-16 overflow-hidden rounded-full">
                  {item.avatar ? (
                    <Image
                      src={item.avatar}
                      alt={item.name}
                      className="object-cover"
                      fill
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-200 text-lg font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="truncate text-lg font-medium">{item.title}</h3>
                  <div className="mt-1 text-sm text-gray-500">
                    {new Date(item.pubDate).toLocaleString("zh-CN", {})}
                  </div>
                </div>
              </div>
              <div className="ml-20 mt-1 text-sm text-gray-500">
                {item.description}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
