"use client";

import { AreaChartBlock } from "./charts/area-chart-block";
import { ChartErrorCard, ChartFrame } from "./charts/chart-frame";
import { ChoroplethChartBlock } from "./charts/choropleth-chart-block";
import { FunnelChartBlock } from "./charts/funnel-chart-block";
import { PieChartBlock } from "./charts/pie-chart-block";
import { RadarChartBlock } from "./charts/radar-chart-block";
import { SankeyChartBlock } from "./charts/sankey-chart-block";
import {
  type NormalizedChartSpec,
  normalizeChartSpec,
  parseChartSpec,
} from "./charts/spec";

function renderByType(spec: NormalizedChartSpec) {
  if (spec.type === "area") {
    return <AreaChartBlock spec={spec} />;
  }

  if (spec.type === "pie") {
    return <PieChartBlock spec={spec} />;
  }

  if (spec.type === "radar") {
    return <RadarChartBlock spec={spec} />;
  }

  if (spec.type === "funnel") {
    return <FunnelChartBlock spec={spec} />;
  }

  if (spec.type === "sankey") {
    return <SankeyChartBlock spec={spec} />;
  }

  return <ChoroplethChartBlock spec={spec} />;
}

export function ChartBlock({ spec }: { spec?: string }) {
  if (typeof spec !== "string" || !spec.trim()) {
    return <ChartErrorCard message="Missing chart spec." />;
  }

  const parsed = parseChartSpec(spec);
  if (!parsed.ok) {
    return <ChartErrorCard message={parsed.error} />;
  }

  const normalized = normalizeChartSpec(parsed.value);
  if (!normalized.ok) {
    return <ChartErrorCard message={normalized.error} />;
  }

  const resolved = normalized.value;
  const rendered = renderByType(resolved);

  return (
    <ChartFrame className={resolved.className} title={resolved.title}>
      {rendered}
    </ChartFrame>
  );
}
