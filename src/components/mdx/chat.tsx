"use client";

import { useEffect, useState } from "react";

type UserChatData = {
    userName: string;
    messages: string;
    isMe: boolean;
};

type ChatProps = {
    data: UserChatData[]; // Replace with actual type of chat data
};
export function Chat({ data }: ChatProps) {
    if (!data || data.length === 0) {
        return <div>No chat data available.</div>;
    }
    return (
        <section>
            {data.map((chat, index) => (
                <div key={index} className={`flex ${(!chat.userName || chat.isMe) ? "justify-end" : "justify-start"} mb-4`}>
                    <div className={`max-w-xs ${!chat.userName || chat.isMe ? "text-right" : "text-left"}`}>
                        <div style={{ fontSize: 12 }} className={`text-gray-600 dark:text-gray-400 pb-0.5`}>{chat.userName}</div>
                        <div className={`p-2 rounded-lg shadow-md ${!chat.userName || chat.isMe ? "bg-sky-300 dark:bg-sky-700" : "bg-gray-200 dark:bg-gray-800"}`}>{chat.messages}</div>
                    </div>
                </div>
            ))}
        </section>
    );
}