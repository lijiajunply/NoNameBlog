import { Icon } from "@/components/mdx/icon";
import { Badge } from "@/components/ui/badge";
import {
  Timeline as TimelineContainer,
  TimelineItem,
  TimelineIndicator,
  TimelineSeparator,
  TimelineTitle,
  TimelineDate,
  TimelineDescription,
  TimelineContent,
  TimelineHeader,
} from "@/components/ui/timeline";
import { cn } from "@/lib/utils";

type TimelineItemData = {
  title: string;
  date?: string;
  description?: string;
  badge?: string;
  icon?: string;
  tags?: string[];
};

type TimelineProps = {
  title?: string;
  description?: string;
  items?: TimelineItemData[];
  data?: TimelineItemData[];
  className?: string;
};

export function Timeline({
  title,
  description,
  items = [],
  data = [],
  className,
}: TimelineProps) {
  const timelineItems = data.length ? data : items;

  if (!timelineItems.length) {
    return null;
  }

  return (
    <div className={cn("my-10", className)}>
      {title && (
        <div className="mb-8">
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <TimelineContainer className="ml-6 border-l border-border pl-6">
        <ul className="m-0 list-none p-0">
          {timelineItems.map((item, index) => {
            const isLast = index === timelineItems.length - 1;

            return (
              <TimelineItem key={`${item.title}-${index}`}>
                <TimelineIndicator />
                {!isLast && <TimelineSeparator />}
                
                <TimelineHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.date && <TimelineDate>{item.date}</TimelineDate>}
                    {item.badge && (
                      <Badge className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.icon && (
                      <Icon icon={item.icon} className="size-4 text-muted-foreground" />
                    )}
                    <TimelineTitle>{item.title}</TimelineTitle>
                  </div>
                </TimelineHeader>

                {(item.description || (item.tags && item.tags.length > 0)) && (
                  <TimelineContent>
                    {item.description && (
                      <TimelineDescription>{item.description}</TimelineDescription>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {item.tags.map((tag) => (
                          <Badge
                            key={tag}
                            className="border-none bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TimelineContent>
                )}
              </TimelineItem>
            );
          })}
        </ul>
      </TimelineContainer>
    </div>
  );
}
