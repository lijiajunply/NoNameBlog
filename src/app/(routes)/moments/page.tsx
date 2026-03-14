import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { MomentsCard } from "@/components/moment-cards";
import { siteConfig } from "@/config/site";
import { readRssXml } from "@/lib/content/rss-client";
import { friendSchema } from "@/lib/content/schema";
import type { Friend } from "@/types/content";
import type { FriendFeedItem } from "@/types/rss";

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
  ).sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
  );
}

export default async function MomentsPage() {
  const friends = getFriends();
  const items = await getFriendFeedItems(friends);

  return <MomentsCard items={items} />;
}
