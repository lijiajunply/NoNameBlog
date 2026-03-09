"use client";

import { FunnelChart } from "@/components/charts/funnel-chart";
import type { NormalizedFunnelSpec } from "./spec";

export function FunnelChartBlock({ spec }: { spec: NormalizedFunnelSpec }) {
  const data = spec.data.map((item) => ({
    label: item.stage,
    value: item.value,
  }));

  return (
    <FunnelChart
      data={data}
      edges="curved"
      grid={{ bands: false, lines: true }}
      labelLayout="spread"
      orientation="horizontal"
      showLabels
      showPercentage
      showValues
    />
  );
}
