import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getAllCategories } from "@/lib/content/posts";

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
        分类
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={`/categories/${encodeURIComponent(category.name)}`}
          >
            <Card className="flex items-center justify-between">
              <span className="font-medium text-neutral-900 dark:text-white">
                {category.name}
              </span>
              <span className="text-sm text-neutral-500">{category.count}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
