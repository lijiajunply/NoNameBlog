"use client";

import { PieCenter } from "@/components/charts/pie-center";
import { PieChart } from "@/components/charts/pie-chart";
import { PieSlice } from "@/components/charts/pie-slice";
import type { NormalizedPieSpec } from "./spec";

export function PieChartBlock({ spec }: { spec: NormalizedPieSpec }) {
  const data = spec.data.map((item) => ({
    label: item.name,
    value: item.value,
    color: item.color,
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
