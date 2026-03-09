"use client";

import {
  SankeyChart,
  SankeyLink,
  SankeyNode,
  SankeyTooltip,
} from "@/components/charts/sankey";
import { CHART_VIVID_PALETTE } from "@/config/chart-palette";
import type { NormalizedSankeySpec } from "./spec";

export function SankeyChartBlock({ spec }: { spec: NormalizedSankeySpec }) {
  const indexById = new Map(spec.nodes.map((node, index) => [node.id, index]));

  const data = {
    nodes: spec.nodes.map((node) => ({
      name: node.label || node.id,
    })),
    links: spec.links
      .map((link) => {
        const source = indexById.get(link.source);
        const target = indexById.get(link.target);
        if (source === undefined || target === undefined) {
          return null;
        }

        return {
          source,
          target,
          value: link.value,
        };
      })
      .filter(
        (item): item is { source: number; target: number; value: number } =>
          item !== null,
      ),
  };

  return (
    <SankeyChart data={data}>
      <SankeyLink
        getLinkColor={(_, index) =>
          CHART_VIVID_PALETTE[index % CHART_VIVID_PALETTE.length] || "#2563eb"
        }
        strokeOpacity={0.42}
        useGradient={false}
      />
      <SankeyNode
        getNodeColor={(_, index) =>
          CHART_VIVID_PALETTE[index % CHART_VIVID_PALETTE.length] || "#2563eb"
        }
      />
      <SankeyTooltip />
    </SankeyChart>
  );
}
