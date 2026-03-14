"use client";

import { useEffect, useState } from "react";
import { readRssXml } from "@/lib/content/rss-client";
import type { Friend } from "@/lib/content/schema";
import type { RssItem } from "@/types/rss-item";

type FriendFeedItem = RssItem & { name: string; avatar: string | undefined };

export function FriendCard({ friends }: { friends: Friend[] }) {
  const [items, setItems] = useState<FriendFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadFeeds() {
      const data: FriendFeedItem[] = [];

      for (const friend of friends) {
        const possibleRssUrls = [
          `${friend.url}feed`,
          `${friend.url}rss.xml`,
          `${friend.url}atom.xml`,
        ];
        let feedLoaded = false;
        const failedUrls: string[] = [];

        for (const rssUrl of possibleRssUrls) {
          try {
            const rssItems = await readRssXml(rssUrl);
            if (rssItems.length === 0) {
              failedUrls.push(`${rssUrl} (empty feed)`);
              continue;
            }

            data.push(
              ...rssItems.map((item) => {
                return {
                  ...item,
                  name: friend.name,
                  avatar: friend.avatar,
                };
              }),
            );
            feedLoaded = true;
            break;
          } catch {
            failedUrls.push(rssUrl);
          }
        }

        if (!feedLoaded && failedUrls.length > 0) {
          console.warn(
            `Unable to read RSS feed for ${friend.name} from: ${failedUrls.join(", ")}`,
          );
        }
      }

      const uniqueItems = Array.from(
        new Map(
          data.map((item) => {
            const key =
              item.link !== "#" ? item.link : `${item.title}-${item.pubDate}`;
            return [key, item];
          }),
        ).values(),
      ).sort(
        (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
      );

      if (!isCancelled) {
        setItems(uniqueItems);
        setIsLoading(false);
      }
    }

    void loadFeeds();

    return () => {
      isCancelled = true;
    };
  }, [friends]);

  if (isLoading) {
    return <FriendCardLoading />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">朋友圈</h2>
      <div className="grid grid-cols-1 gap-4 mt-8">
        {items.map((item) => {
          const itemKey =
            item.link !== "#" ? item.link : `${item.title}-${item.pubDate}`;

          return (
            <a
              key={itemKey}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-4 h-20 rounded-lg border border-gray-200 p-4 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <img
                src={item.avatar}
                alt={item.name}
                className="rounded-lg object-cover size-16"
              />
              <div className="">
                <h3 className="text-lg font-medium truncate">{item.title}</h3>
                <div className="text-sm text-gray-500 mt-1">
                  {item.description}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function FriendCardLoading() {
  return (
    <div>
      <h2 className="text-2xl font-bold">朋友圈</h2>
      <div className="mt-4 text-sm text-gray-500">正在加载中...</div>
      <div className="grid grid-cols-1 gap-4 mt-8">
        {[...Array(5).keys()].map((cardId) => (
          <div
            key={cardId}
            className="rounded-lg border border-gray-200 p-4 shadow-sm animate-pulse dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-4 h-4 w-full rounded bg-gray-100 dark:bg-gray-700" />
            <div className="mt-2 h-4 w-5/6 rounded bg-gray-100 dark:bg-gray-700" />
            <div className="mt-2 h-4 w-1/2 rounded bg-gray-100 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
