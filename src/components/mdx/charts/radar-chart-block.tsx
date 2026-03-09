"use client";

import { RadarArea } from "@/components/charts/radar-area";
import { RadarAxis } from "@/components/charts/radar-axis";
import { RadarChart } from "@/components/charts/radar-chart";
import { RadarGrid } from "@/components/charts/radar-grid";
import { RadarLabels } from "@/components/charts/radar-labels";
import type { NormalizedRadarSpec } from "./spec";

export function RadarChartBlock({ spec }: { spec: NormalizedRadarSpec }) {
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

  const data = spec.series.map((line) => ({
    label: line.label || line.key,
    color: line.color,
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
