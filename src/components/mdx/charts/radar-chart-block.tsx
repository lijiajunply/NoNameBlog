"use client";

import { RadarArea } from "@/components/charts/radar-area";
import { RadarAxis } from "@/components/charts/radar-axis";
import { RadarChart } from "@/components/charts/radar-chart";
import { RadarGrid } from "@/components/charts/radar-grid";
import { RadarLabels } from "@/components/charts/radar-labels";
import { CHART_VIVID_PALETTE } from "@/config/chart-palette";
import type { NormalizedRadarSpec } from "./spec";

const MONO_RADAR_COLOR_VARS = new Set([
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-line-primary)",
  "var(--chart-line-secondary)",
]);

export function RadarChartBlock({ spec }: { spec: NormalizedRadarSpec }) {
  const resolveRadarColor = (rawColor: string | undefined, index: number) => {
    if (rawColor && !MONO_RADAR_COLOR_VARS.has(rawColor)) {
      return rawColor;
    }
    return CHART_VIVID_PALETTE[index % CHART_VIVID_PALETTE.length];
  };

  const metrics = spec.data.map((row, index) => {
    const rawLabel = row[spec.axisKey];
    const label =
      typeof rawLabel === "string" && rawLabel.trim()
        ? rawLabel
        : `Metric ${index + 1}`;

    return {
      key: `metric_${index + 1}`,
      label,
    };
  });

  const data = spec.series.map((line, index) => ({
    label: line.label || line.key,
    color: resolveRadarColor(line.color, index),
    values: Object.fromEntries(
      metrics.map((metric, index) => {
        const row = spec.data[index];
        const rawValue = row?.[line.key];
        const value = typeof rawValue === "number" ? rawValue : 0;
        return [metric.key, value];
      }),
    ),
  }));

  return (
    <RadarChart data={data} levels={5} metrics={metrics}>
      <RadarGrid />
      <RadarAxis />
      <RadarLabels />
      {data.map((_, index) => (
        <RadarArea
          index={index}
          key={`radar-area-${spec.series[index]?.key || index}`}
        />
      ))}
    </RadarChart>
  );
}
