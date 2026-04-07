import {
  isLogicChartLayoutType,
} from "../../domain/mindmap/model";
import { buildExportBackground } from "../../domain/mindmap/backgroundPresets/exportBackground";
import { EXPORT_NODE_GRADIENTS, type ExportSnapshot } from "./config";
import { buildNodeMarkup } from "./svgNodeMarkup";
import { escapeXml } from "./svgTextLayout";

export function buildSvgMarkup(snapshot: ExportSnapshot): string {
  const isLogicChart = isLogicChartLayoutType(snapshot.layoutType);
  const background = buildExportBackground(
    snapshot.backgroundPresetId,
    snapshot.width,
    snapshot.height,
  );
  const connectorMarkup = snapshot.connectors
    .map(
      (connector) => `
        <path
          d="${escapeXml(connector.path)}"
          fill="none"
          stroke="${connector.color}"
          stroke-linecap="round"
          stroke-width="${isLogicChart ? 3.4 : 3}"
          stroke-opacity="${isLogicChart ? 0.9 : 0.78}"
        />
      `,
    )
    .join("");
  const nodeMarkup = snapshot.nodes
    .map((snapshotNode) => buildNodeMarkup(snapshotNode, snapshot.layoutType))
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${snapshot.width}"
  height="${snapshot.height}"
  viewBox="0 0 ${snapshot.width} ${snapshot.height}"
  role="img"
>
  <defs>
    ${background.defs}
    <filter
      id="mindora-node-shadow"
      x="-30%"
      y="-30%"
      width="160%"
      height="180%"
    >
      <feDropShadow
        dx="0"
        dy="18"
        flood-color="#000000"
        flood-opacity="0.24"
        stdDeviation="18"
      />
    </filter>
    ${buildGradientDefs()}
  </defs>

${background.markup}

  <g>
    ${connectorMarkup}
  </g>

  <g>
    ${nodeMarkup}
  </g>
</svg>`;
}

function buildGradientDefs(): string {
  return Object.entries(EXPORT_NODE_GRADIENTS)
    .map(
      ([color, gradient]) => `
        <linearGradient id="mindora-node-fill-${color}" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${gradient.start}" />
          <stop offset="100%" stop-color="${gradient.end}" />
        </linearGradient>
      `,
    )
    .join("");
}
