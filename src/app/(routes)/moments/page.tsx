import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { readRssXml } from "@/lib/content/rss-client";
import { type Friend, friendSchema } from "@/lib/content/schema";
import type { RssItem } from "@/types/rss-item";

export const metadata: Metadata = {
  title: "朋友圈",
  description: "看看其他朋友都写了啥",
  alternates: {
    canonical: `${siteConfig.siteUrl}/moments/`,
  },
};

function getFriends(): Friend[] {
  const fullPath = path.join(process.cwd(), "content/friends.json");
  const source = fs.readFileSync(fullPath, "utf8");
  const raw = JSON.parse(source) as unknown[];

  return raw
    .map((item) => friendSchema.parse(item))
    .filter((item) => item.url !== `${siteConfig.siteUrl}/`)
    .toSorted((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

type FriendFeedItem = RssItem & { name: string; avatar: string | undefined };

async function getFriendFeedItems(friends: Friend[]) {
  const data: FriendFeedItem[] = [];

  for (const friend of friends) {
    console.log(`Reading RSS feed for ${friend.name}`);
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
          ...rssItems.map((item) => ({
            ...item,
            name: friend.name,
            avatar: friend.avatar,
          })),
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

  return Array.from(
    new Map(
      data.map((item) => {
        const key =
          item.link !== "#" ? item.link : `${item.title}-${item.pubDate}`;
        return [key, item];
      }),
    ).values(),
  ).sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

export default async function MomentsPage() {
  const friends = getFriends();
  const items = await getFriendFeedItems(friends);

  return (
    <div className="container mx-auto">
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
                className="flex w-full items-center gap-4 min-h-20 rounded-lg border border-gray-200 p-4 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="rounded-lg object-cover size-16"
                />
                <div>
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
    </div>
  );
}
