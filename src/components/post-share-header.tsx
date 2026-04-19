"use client";

import { Copy, Link2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useHeaderSlotContext } from "@/components/header-slot";

type PostShareHeaderProps = {
  title: string;
  summary?: string;
  url: string;
};

function buildShareText(
  title: string,
  summary: string | undefined,
  url: string,
) {
  const parts = [title];

  if (summary) {
    parts.push(summary);
  }

  parts.push(url);
  return parts.join("\n");
}

export function PostShareHeader({ title, summary, url }: PostShareHeaderProps) {
  const { setHeaderContent, clearHeaderContent } = useHeaderSlotContext();
  const shareText = useMemo(
    () => buildShareText(title, summary, url),
    [title, summary, url],
  );

  useEffect(() => {
    setHeaderContent(
      <PostShareHeaderActions shareText={shareText} url={url} />,
    );

    return () => {
      clearHeaderContent();
    };
  }, [clearHeaderContent, setHeaderContent, shareText, url]);

  return null;
}

function PostShareHeaderActions({
  shareText,
  url,
}: {
  shareText: string;
  url: string;
}) {
  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.error("Failed to copy share content:", error);
    }
  }

  return (
    <div className="hidden md:flex min-w-0 items-center gap-1 overflow-x-auto">
      <HeaderActionButton
        icon={<Link2 className="size-3.5" />}
        label="复制链接"
        onClick={() => copyToClipboard(url)}
      />
      <HeaderActionButton
        icon={<Copy className="size-3.5" />}
        label="复制文本"
        onClick={() => copyToClipboard(shareText)}
      />
    </div>
  );
}

function HeaderActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] px-2 py-1 text-xs text-[color-mix(in_srgb,var(--foreground)_72%,transparent)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-foreground"
    >
      {icon}
      {label}
    </button>
  );
}
