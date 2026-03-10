"use client";

import { motion, useSpring } from "motion/react";
import { useEffect, useMemo, useRef } from "react";

const TICKER_ITEM_HEIGHT = 24;

export interface DateTickerProps {
  currentIndex: number;
  labels: string[];
  visible: boolean;
}

export function DateTicker({ currentIndex, labels, visible }: DateTickerProps) {
  // Parse labels into month and day parts
  const parsedLabels = useMemo(() => {
    return labels.map((label) => {
      const parts = label.split(" ");
      const month = parts[0] || "";
      const day = parts[1] || "";
      return { month, day, full: label };
    });
  }, [labels]);

  // Get unique months and their indices
  const monthIndices = useMemo(() => {
    const segments: Array<{ month: string; startIndex: number }> = [];

    parsedLabels.forEach((label, index) => {
      const lastSegment = segments.at(-1);
      if (!lastSegment || lastSegment.month !== label.month) {
        segments.push({
          month: label.month,
          startIndex: index,
        });
      }
    });

    return { segments };
  }, [parsedLabels]);

  // Find current month index
  const currentMonthIndex = useMemo(() => {
    if (currentIndex < 0 || currentIndex >= parsedLabels.length) {
      return 0;
    }
    // Use the latest month segment whose start index is <= current index.
    for (let i = monthIndices.segments.length - 1; i >= 0; i--) {
      if (currentIndex >= monthIndices.segments[i].startIndex) {
        return i;
      }
    }
    return 0;
  }, [currentIndex, parsedLabels.length, monthIndices.segments]);

  // Track previous month index
  const prevMonthIndexRef = useRef(-1);

  // Animated Y offsets
  const dayY = useSpring(0, { stiffness: 400, damping: 35 });
  const monthY = useSpring(0, { stiffness: 400, damping: 35 });

  // Update day scroll position
  useEffect(() => {
    dayY.set(-currentIndex * TICKER_ITEM_HEIGHT);
  }, [currentIndex, dayY]);

  // Update month scroll position only when month changes
  useEffect(() => {
    if (currentMonthIndex >= 0) {
      const isFirstRender = prevMonthIndexRef.current === -1;
      const monthChanged = prevMonthIndexRef.current !== currentMonthIndex;

      if (isFirstRender || monthChanged) {
        monthY.set(-currentMonthIndex * TICKER_ITEM_HEIGHT);
        prevMonthIndexRef.current = currentMonthIndex;
      }
    }
  }, [currentMonthIndex, monthY]);

  if (!visible || labels.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="overflow-hidden rounded-full bg-zinc-900 px-4 py-1 text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
      layout
      transition={{
        layout: { type: "spring", stiffness: 400, damping: 35 },
      }}
    >
      <div className="relative h-6 overflow-hidden">
        <div className="flex items-center justify-center gap-1">
          {/* Month stack */}
          <div className="relative h-6 overflow-hidden">
            <motion.div className="flex flex-col" style={{ y: monthY }}>
              {monthIndices.segments.map((segment) => (
                <div
                  className="flex h-6 shrink-0 items-center justify-center"
                  key={`${segment.month}-${segment.startIndex}`}
                >
                  <span className="whitespace-nowrap font-medium text-sm">
                    {segment.month}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Day stack */}
          <div className="relative h-6 overflow-hidden">
            <motion.div className="flex flex-col" style={{ y: dayY }}>
              {parsedLabels.map((label, index) => (
                <div
                  className="flex h-6 shrink-0 items-center justify-center"
                  key={`${label.day}-${index}`}
                >
                  <span className="whitespace-nowrap font-medium text-sm">
                    {label.day}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

DateTicker.displayName = "DateTicker";

export default DateTicker;
