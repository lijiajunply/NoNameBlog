"use client";

import { useMemo } from "react";
import type { NormalizedPieSpec } from "./spec";

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const startX = centerX + radius * Math.cos(startAngle);
  const startY = centerY + radius * Math.sin(startAngle);
  const endX = centerX + radius * Math.cos(endAngle);
  const endY = centerY + radius * Math.sin(endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  return `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
}

export function PieChartBlock({ spec }: { spec: NormalizedPieSpec }) {
  const data = useMemo(() => {
    const total = spec.data.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) {
      return [];
    }

    let current = -Math.PI / 2;
    return spec.data.map((item, index) => {
      const fraction = item.value / total;
      const sweep = fraction * Math.PI * 2;
      const startAngle = current;
      const endAngle = current + sweep;
      current = endAngle;

      return {
        ...item,
        startAngle,
        endAngle,
        percentage: fraction,
        color: item.color || `var(--chart-${(index % 5) + 1})`,
      };
    });
  }, [spec.data]);

  const total = spec.data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative mx-auto w-full max-w-[340px]"
        style={{ aspectRatio: "1 / 1" }}
      >
        <svg className="h-full w-full" viewBox="0 0 100 100">
          <title>{spec.title || "Pie chart"}</title>
          {data.map((item) => (
            <path
              d={describeArc(50, 50, 42, item.startAngle, item.endAngle)}
              fill={item.color}
              key={`${item.name}-${item.value}`}
              stroke="var(--chart-background)"
              strokeWidth={0.8}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-md bg-white/70 px-3 py-1 text-center text-xs dark:bg-black/25">
            <div className="font-medium text-neutral-800 dark:text-neutral-200">
              Total
            </div>
            <div className="text-neutral-600 dark:text-neutral-400">
              {total.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {data.map((item) => (
          <div
            className="flex items-center justify-between gap-2 rounded-md bg-black/5 px-2 py-1.5 text-xs dark:bg-white/5"
            key={`legend-${item.name}`}
          >
            <span className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-medium text-neutral-800 tabular-nums dark:text-neutral-200">
              {(item.percentage * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
