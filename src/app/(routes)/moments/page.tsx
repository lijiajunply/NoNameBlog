import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { type RssItem, readRssXml } from "@/lib/content/rss";
import { type Friend, friendSchema } from "@/lib/content/schema";

export const metadata: Metadata = {
  title: "朋友圈",
  description: "看看其他朋友都写了啥",
  alternates: {
    canonical: `${siteConfig.siteUrl}/moments/`,
  },
};

const loadingCardIds = [
  "loading-card-1",
  "loading-card-2",
  "loading-card-3",
  "loading-card-4",
  "loading-card-5",
  "loading-card-6",
];

function getFriends(): Friend[] {
  const fullPath = path.join(process.cwd(), "content/friends.json");
  const source = fs.readFileSync(fullPath, "utf8");
  const raw = JSON.parse(source) as unknown[];

  return raw
    .map((item) => friendSchema.parse(item))
    .filter((item) => item.url !== `${siteConfig.siteUrl}/`)
    .toSorted((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export default function MomentsPage() {
  const friends = getFriends();

  return (
    <div className="container mx-auto">
      <Suspense fallback={<FriendCardLoading />}>
        <FriendCard friends={friends} />
      </Suspense>
    </div>
  );
}

async function FriendCard({ friends }: { friends: Friend[] }) {
  const data: RssItem[] = [];

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
        const items = await readRssXml(rssUrl);
        if (items.length === 0) {
          failedUrls.push(`${rssUrl} (empty feed)`);
          continue;
        }

        data.push(...items);
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

  return (
    <div>
      <h2 className="text-2xl font-bold">朋友圈</h2>
      <div className="grid grid-cols-1 gap-4 mt-8">
        {uniqueItems.map((item) => {
          const itemKey =
            item.link !== "#" ? item.link : `${item.title}-${item.pubDate}`;

          return (
            <a
              key={itemKey}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-gray-200 p-4 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <h3 className="text-lg font-medium">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-3">{item.description}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function FriendCardLoading() {
  return (
    <div>
      <h2 className="text-2xl font-bold">朋友圈</h2>
      <div className="mt-4 text-sm text-gray-500">正在加载中...</div>
      <div className="grid grid-cols-1 gap-4 mt-8">
        {loadingCardIds.map((cardId) => (
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
