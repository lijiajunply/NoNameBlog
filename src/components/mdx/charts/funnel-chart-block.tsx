"use client";

import type { NormalizedFunnelSpec } from "./spec";

export function FunnelChartBlock({ spec }: { spec: NormalizedFunnelSpec }) {
  const maxValue = Math.max(...spec.data.map((item) => item.value), 1);

  return (
    <div className="space-y-2">
      {spec.data.map((item, index) => {
        const ratio = item.value / maxValue;
        const widthPercent = Math.max(12, ratio * 100);
        const color = `var(--chart-${(index % 5) + 1})`;

        return (
          <div className="relative" key={`${item.stage}-${item.value}`}>
            <div
              className="mx-auto flex h-10 items-center justify-between rounded-md px-3 text-xs"
              style={{
                width: `${widthPercent}%`,
                backgroundColor: color,
                color: "var(--chart-background)",
              }}
            >
              <span className="font-medium">{item.stage}</span>
              <span className="tabular-nums">
                {item.value.toLocaleString()}
              </span>
            </div>
            {index < spec.data.length - 1 ? (
              <div className="mx-auto h-3 w-px bg-neutral-300/70 dark:bg-neutral-600/70" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
