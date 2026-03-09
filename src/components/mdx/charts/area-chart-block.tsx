"use client";

import { Area, AreaChart } from "@/components/charts/area-chart";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import type { NormalizedAreaSpec } from "./spec";

export function AreaChartBlock({ spec }: { spec: NormalizedAreaSpec }) {
  const labelMap = new Map(
    spec.series.map((item) => [item.key, item.label || item.key]),
  );

  return (
    <AreaChart
      aspectRatio={spec.aspectRatio}
      data={spec.data}
      margin={{ top: 12, right: 12, bottom: 24, left: 12 }}
      xDataKey={spec.xKey}
    >
      <Grid horizontal numTicksRows={4} />
      {spec.series.map((line, index) => {
        const color = line.color || `var(--chart-${(index % 5) + 1})`;
        return (
          <Area
            dataKey={line.key}
            fill={color}
            fillOpacity={line.fillOpacity ?? 0.16}
            key={line.key}
            stroke={color}
            strokeWidth={line.strokeWidth ?? 2}
          />
        );
      })}
      <ChartTooltip
        rows={(point) =>
          spec.series.map((line, index) => ({
            color: line.color || `var(--chart-${(index % 5) + 1})`,
            label: labelMap.get(line.key) || line.key,
            value: (point[line.key] as number) ?? 0,
          }))
        }
      />
      <XAxis numTicks={spec.xAxisTicks} />
    </AreaChart>
  );
}
