'use client';

import { FriendFeedItem } from "@/types/rss-item";
import { useState, useEffect } from "react";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Icon } from "@iconify/react";

export function MomentsCard({ items }: { items: FriendFeedItem[] }) {
    const [contextListShow, setContextListShow] = useState<'list' | 'grid'>(() => (typeof window !== 'undefined' && window.innerWidth < 1024 ? 'list' : 'grid'));
    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        const handleResize = () => {
            setContextListShow(window.innerWidth < 1024 ? 'list' : 'grid');
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="container mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">朋友圈</h2>
                <ToggleGroup variant="outline"
                    type="single"
                    size="sm" value={contextListShow} onValueChange={(value) => setContextListShow(value as 'list' | 'grid')}>
                    <ToggleGroupItem value="list" aria-label="list">
                        <Icon icon="lucide:list" className="h-5 w-5" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="grid" aria-label="grid">
                        <Icon icon="lucide:grid-2x2" className="h-5 w-5" />
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            <div className={`grid gap-4 mt-4 ${contextListShow === 'list' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {items.map((item) => {
                    const itemKey =
                        item.link !== "#" ? item.link : `${item.title}-${item.pubDate}`;

                    return (
                        <a
                            key={itemKey}
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full gap-4 min-h-20 rounded-lg border border-gray-200 p-4 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                        >
                            <div className="flex items-center">
                                <img
                                    src={item.avatar}
                                    alt={item.name}
                                    className="rounded-full object-cover size-16"
                                />
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium truncate">{item.title}</h3>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {new Date(item.pubDate).toLocaleString("zh-CN", {})}
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500 mt-1 ml-20">
                                {item.description}
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}