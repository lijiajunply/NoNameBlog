import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FriendCard, FriendCardLoading } from "@/components/moment-cards";
import { siteConfig } from "@/config/site";
import { type Friend, friendSchema } from "@/lib/content/schema";

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
