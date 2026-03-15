import type { Metadata } from "next";
import { MomentsContent } from "@/components/moment-cards";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "朋友圈",
  description: "看看其他朋友都写了啥",
  alternates: {
    canonical: `${siteConfig.siteUrl}/moments/`,
  },
};

export default function MomentsPage() {
  return <MomentsContent />;
}
