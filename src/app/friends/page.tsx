import fs from "node:fs";
import path from "node:path";
import { Icon } from "@iconify/react";
import type { Metadata } from "next";
import Link from "next/link";
import { FriendsInputButton } from "@/components/friends-input-button";
import { CodeBlockFigure } from "@/components/mdx/code-block-figure";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { siteConfig } from "@/config/site";
import { type Friend, friendSchema } from "@/lib/content/schema";

export const metadata: Metadata = {
  title: "友链",
  description: "朋友们的网站与项目推荐。",
  alternates: {
    canonical: `${siteConfig.siteUrl}/friends/`,
  },
};

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
  const friendLinkTemplate = JSON.stringify(
    {
      name: "LuckyFish",
      url: "https://blog.luckyfishes.site/",
      description: "自己随便写的",
      avatar: "https://blog.luckyfishes.site/favicon.ico",
      category: "个人博客",
    },
    null,
    2,
  );
  const friendLinkTemplateLines = friendLinkTemplate.split("\n");

  // Group friends by category
  const groupedFriends = friends.reduce(
    (acc, friend) => {
      const cat = friend.category || "其他";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(friend);
      return acc;
    },
    {} as Record<string, Friend[]>,
  );

  return (
    <div className="space-y-16 pb-16">
      {/* Friends Grouped Lists */}
      <div className="space-y-12">
        {Object.entries(groupedFriends).map(([category, items]) => (
          <section key={category} className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                {category}
              </h2>
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              <span className="text-sm font-medium text-neutral-400">
                {items.length} links
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((friend) => {
                let hostname = "";
                try {
                  hostname = new URL(friend.url).hostname.replace(/^www\./, "");
                } catch {
                  hostname = friend.url;
                }

                return (
                  <Link
                    key={friend.url}
                    href={friend.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-4 rounded-2xl border border-black/5 bg-white/60 p-4 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-md dark:border-white/10 dark:bg-black/40 dark:hover:bg-black/60"
                  >
                    {/* Top right external link icon */}
                    <div className="absolute right-4 top-4 text-neutral-400 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:text-neutral-500">
                      <Icon icon="ph:arrow-up-right-bold" className="h-4 w-4" />
                    </div>

                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-white transition-transform duration-500 group-hover:scale-105 rounded-xl dark:border-white/10 dark:bg-neutral-900">
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-2xl font-semibold text-neutral-400 dark:text-neutral-500">
                          {friend.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-center min-w-0 pr-4">
                      <h3 className="truncate text-base font-semibold text-neutral-900 dark:text-white">
                        {friend.name}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {friend.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
                        <Icon
                          icon="ph:link-simple-bold"
                          className="h-3 w-3 shrink-0"
                        />
                        <span className="truncate">{hostname}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="border border-dotted" style={{ height: 0.5 }}></div>

      <div className="text-center text-2xl font-semibold">
        无内鬼，加一下我的友链
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
          <InputGroup>
            <InputGroupInput
              id="input-group-url"
              placeholder="example.com"
              value={"LuckyFish"}
              readOnly
            />
            <InputGroupAddon>
              <InputGroupText>我的名字</InputGroupText>
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <FriendsInputButton text={"LuckyFish"} />
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput
              id="input-group-url"
              placeholder="example.com"
              value={"NoName Blog"}
              readOnly
            />
            <InputGroupAddon>
              <InputGroupText>博客名字</InputGroupText>
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <FriendsInputButton text={"NoName Blog"} />
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput
              id="input-group-url"
              placeholder="example.com"
              value={"一条鱼的自娱自乐"}
              readOnly
            />
            <InputGroupAddon>
              <InputGroupText>网站介绍</InputGroupText>
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <FriendsInputButton text={"一条鱼的自娱自乐"} />
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput
              id="input-group-url"
              placeholder="example.com"
              value={"https://blog.luckyfishes.site"}
              readOnly
            />
            <InputGroupAddon>
              <InputGroupText>网址</InputGroupText>
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <FriendsInputButton text={"https://blog.luckyfishes.site"} />
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput
              id="input-group-url"
              placeholder="example.com"
              value={"https://blog.luckyfishes.site/favicon.ico"}
              readOnly
            />
            <InputGroupAddon>
              <InputGroupText>头像</InputGroupText>
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <FriendsInputButton
                text={"https://blog.luckyfishes.site/favicon.ico"}
              />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className="w-full min-w-0 pb-1.5 pt-1.5 lg:flex-1">
          <CodeBlockFigure className="w-full" data-rehype-pretty-code-figure="">
            <pre
              data-language="json"
              className="bg-neutral-50 dark:bg-neutral-950/70"
            >
              <code>
                {friendLinkTemplateLines.map((line, index) => (
                  <span key={`${index}-${line}`} data-line>
                    {line}
                    {index < friendLinkTemplateLines.length - 1 ? "\n" : ""}
                  </span>
                ))}
              </code>
            </pre>
          </CodeBlockFigure>
        </div>
      </div>
    </div>
  );
}
