"use client";

import { PieCenter } from "@/components/charts/pie-center";
import { PieChart } from "@/components/charts/pie-chart";
import { PieSlice } from "@/components/charts/pie-slice";
import { CHART_VIVID_PALETTE } from "@/config/chart-palette";
import type { NormalizedPieSpec } from "./spec";

const MONO_PIE_COLOR_VARS = new Set([
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]);

export function PieChartBlock({ spec }: { spec: NormalizedPieSpec }) {
  const resolvePieColor = (rawColor: string | undefined, index: number) => {
    if (rawColor && !MONO_PIE_COLOR_VARS.has(rawColor)) {
      return rawColor;
    }
    return CHART_VIVID_PALETTE[index % CHART_VIVID_PALETTE.length];
  };

  const data = spec.data.map((item, index) => ({
    label: item.name,
    value: item.value,
    color: resolvePieColor(item.color, index),
  }));

  return (
    <PieChart cornerRadius={4} data={data} innerRadius={58} padAngle={0.01}>
      {data.map((item, index) => (
        <PieSlice
          hoverEffect="translate"
          index={index}
          key={`pie-slice-${item.label}-${item.value}`}
        />
      ))}
      <PieCenter defaultLabel={spec.title || "Total"} />
    </PieChart>
  );
}
