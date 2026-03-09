"use client";

import { useMemo } from "react";
import type { NormalizedSankeySpec } from "./spec";

type NodePlacement = {
  id: string;
  label: string;
  column: number;
  x: number;
  y: number;
  height: number;
  color: string;
};
const NODE_WIDTH = 24;

function buildNodeColumns(spec: NormalizedSankeySpec): string[][] {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();

  for (const node of spec.nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, 0);
  }

  for (const link of spec.links) {
    incoming.set(link.target, (incoming.get(link.target) || 0) + 1);
    outgoing.set(link.source, (outgoing.get(link.source) || 0) + 1);
  }

  const sourceNodes = spec.nodes
    .filter((node) => (incoming.get(node.id) || 0) === 0)
    .map((node) => node.id);

  const nodeColumn = new Map<string, number>();
  const queue =
    sourceNodes.length > 0 ? [...sourceNodes] : [spec.nodes[0]?.id || ""];

  for (const id of queue) {
    if (id) {
      nodeColumn.set(id, 0);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const currentColumn = nodeColumn.get(current) || 0;
    for (const link of spec.links.filter((item) => item.source === current)) {
      const nextColumn = currentColumn + 1;
      const previous = nodeColumn.get(link.target);
      if (previous === undefined || nextColumn > previous) {
        nodeColumn.set(link.target, nextColumn);
        queue.push(link.target);
      }
    }
  }

  for (const node of spec.nodes) {
    if (!nodeColumn.has(node.id)) {
      nodeColumn.set(node.id, 0);
    }
  }

  const maxColumn = Math.max(...Array.from(nodeColumn.values()), 0);
  const columns: string[][] = Array.from({ length: maxColumn + 1 }, () => []);

  for (const node of spec.nodes) {
    const col = nodeColumn.get(node.id) || 0;
    columns[col]?.push(node.id);
  }

  return columns;
}

function linkPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): string {
  const controlOffset = Math.max(20, (endX - startX) * 0.45);
  return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
}

export function SankeyChartBlock({ spec }: { spec: NormalizedSankeySpec }) {
  const { placements, width, height, renderedLinks } = useMemo(() => {
    const width = 900;
    const height = 360;
    const columns = buildNodeColumns(spec);
    const colGap =
      columns.length > 1 ? (width - 180) / (columns.length - 1) : 0;
    const placements = new Map<string, NodePlacement>();

    columns.forEach((ids, colIndex) => {
      const gap = 14;
      const totalGap = gap * Math.max(0, ids.length - 1);
      const availableHeight = height - 50 - totalGap;

      const nodeValues = ids.map((id) => {
        const incoming = spec.links
          .filter((link) => link.target === id)
          .reduce((sum, link) => sum + link.value, 0);
        const outgoing = spec.links
          .filter((link) => link.source === id)
          .reduce((sum, link) => sum + link.value, 0);
        return Math.max(incoming, outgoing, 1);
      });

      const columnTotal = nodeValues.reduce((sum, value) => sum + value, 0);
      let cursorY = 25;

      ids.forEach((id, nodeIndex) => {
        const nodeValue = nodeValues[nodeIndex] ?? 1;
        const ratio =
          columnTotal > 0 ? nodeValue / columnTotal : 1 / ids.length;
        const nodeHeight = Math.max(24, availableHeight * ratio);

        placements.set(id, {
          id,
          label: spec.nodes.find((node) => node.id === id)?.label || id,
          column: colIndex,
          x: 80 + colIndex * colGap,
          y: cursorY,
          height: nodeHeight,
          color: `var(--chart-${(nodeIndex % 5) + 1})`,
        });

        cursorY += nodeHeight + gap;
      });
    });

    const sourceUsed = new Map<string, number>();
    const targetUsed = new Map<string, number>();
    const sourceTotals = new Map<string, number>();
    const targetTotals = new Map<string, number>();

    for (const link of spec.links) {
      sourceTotals.set(
        link.source,
        (sourceTotals.get(link.source) || 0) + link.value,
      );
      targetTotals.set(
        link.target,
        (targetTotals.get(link.target) || 0) + link.value,
      );
    }

    const renderedLinks = spec.links
      .map((link, index) => {
        const source = placements.get(link.source);
        const target = placements.get(link.target);
        if (!(source && target)) {
          return null;
        }

        const sourceTotal = sourceTotals.get(link.source) || 1;
        const targetTotal = targetTotals.get(link.target) || 1;
        const sourceCursor = sourceUsed.get(link.source) || 0;
        const targetCursor = targetUsed.get(link.target) || 0;

        const sourceCenterOffset =
          (sourceCursor / sourceTotal) * source.height +
          ((link.value / sourceTotal) * source.height) / 2;
        const targetCenterOffset =
          (targetCursor / targetTotal) * target.height +
          ((link.value / targetTotal) * target.height) / 2;

        sourceUsed.set(link.source, sourceCursor + link.value);
        targetUsed.set(link.target, targetCursor + link.value);

        return {
          key: `${link.source}-${link.target}-${index}`,
          d: linkPath(
            source.x + NODE_WIDTH,
            source.y + sourceCenterOffset,
            target.x,
            target.y + targetCenterOffset,
          ),
          width: Math.max(2, Math.sqrt(link.value)),
        };
      })
      .filter(
        (item): item is { key: string; d: string; width: number } =>
          item !== null,
      );

    return { placements, width, height, renderedLinks };
  }, [spec]);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        aria-label={spec.title || "Sankey chart"}
        className="h-auto min-w-[760px] w-full"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <title>{spec.title || "Sankey chart"}</title>

        {renderedLinks.map((link) => (
          <path
            d={link.d}
            fill="none"
            key={link.key}
            opacity={0.35}
            stroke="var(--chart-foreground-muted)"
            strokeWidth={link.width}
          />
        ))}

        {Array.from(placements.values()).map((node) => (
          <g key={node.id}>
            <rect
              fill={node.color}
              height={node.height}
              rx={4}
              width={NODE_WIDTH}
              x={node.x}
              y={node.y}
            />
            <text
              fill="var(--chart-foreground)"
              fontSize="11"
              textAnchor={node.column === 0 ? "start" : "end"}
              x={node.column === 0 ? node.x + 30 : node.x - 6}
              y={node.y + node.height / 2 + 4}
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
