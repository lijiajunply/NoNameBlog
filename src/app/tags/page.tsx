import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getAllTags } from "@/lib/content/posts";

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        标签
      </h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        共 {tags.length} 个标签
      </p>
      <div className="flex flex-wrap gap-2.5">
        {tags.map((tag) => (
          <Link key={tag.name} href={`/tags/${encodeURIComponent(tag.name)}`}>
            <Badge className="text-sm">
              #{tag.name} ({tag.count})
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
