'use client';

import { useState } from "react";
import { InputGroupButton } from "./ui/input-group";
import { Icon } from "@iconify/react";

type FriendsInputButtonProps = {
    text: string;
}
export function FriendsInputButton({ text }: FriendsInputButtonProps) {
    const [isCopied, setIsCopied] = useState(false);

    async function copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    }
    return (
            <InputGroupButton
              aria-label="Copy"
              title="Copy"
              size="icon-xs"
              onClick={() => {
                copyToClipboard(text)
              }}
            >
              {isCopied ? <Icon icon="lucide:copy-check" width="16" height="16" /> : <Icon icon="lucide:copy" width="16" height="16" />}
            </InputGroupButton>
    );
}