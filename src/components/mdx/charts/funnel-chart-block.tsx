"use client";

import { FunnelChart } from "@/components/charts/funnel-chart";
import { FUNNEL_VIVID_GRADIENTS } from "@/config/chart-palette";
import type { NormalizedFunnelSpec } from "./spec";

export function FunnelChartBlock({ spec }: { spec: NormalizedFunnelSpec }) {
  const data = spec.data.map((item, index) => {
    const [start, end] = FUNNEL_VIVID_GRADIENTS[
      index % FUNNEL_VIVID_GRADIENTS.length
    ] || ["var(--chart-1)", "var(--chart-2)"];
    return {
      label: item.stage,
      value: item.value,
      gradient: [
        { offset: "0%", color: start },
        { offset: "100%", color: end },
      ],
    };
  });

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
