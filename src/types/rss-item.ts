export type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export type FriendFeedItem = RssItem & { name: string; avatar: string | undefined };