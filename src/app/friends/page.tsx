import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { type Friend, friendSchema } from "@/lib/content/schema";

function getFriends(): Friend[] {
  const fullPath = path.join(process.cwd(), "content/friends.json");
  const source = fs.readFileSync(fullPath, "utf8");
  const raw = JSON.parse(source) as unknown[];

  return raw
    .map((item) => friendSchema.parse(item))
    .toSorted((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export default function FriendsPage() {
  const friends = getFriends();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        友链
      </h1>
      <div className="grid gap-4 md:grid-cols-2">
        {friends.map((friend) => (
          <Card key={friend.url} className="space-y-3">
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">
              {friend.name}
            </p>
            <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              {friend.description}
            </p>
            <Link
              href={friend.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm text-neutral-700 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-900 dark:text-neutral-300 dark:decoration-neutral-700 dark:hover:text-white"
            >
              {friend.url}
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
