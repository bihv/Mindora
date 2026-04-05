import {
  NODE_COLORS,
  getBranchDirection,
  getSubtreeIds,
  type MindMapDocument,
  type MindMapNode,
  type NodeColor,
} from "../../mindmap";
import {
  CONNECTOR_CURVE_OFFSET,
  NODE_HEIGHT,
  NODE_WIDTH,
} from "./constants";
import { createConnectorPath } from "./layout";
import type { Position } from "./types";
import type { ExportFormat } from "./exportTypes";

type ExportSnapshot = {
  connectors: Array<{
    color: string;
    path: string;
  }>;
  height: number;
  nodes: Array<{
    node: MindMapNode;
    x: number;
    y: number;
  }>;
  width: number;
};

type NodeGradient = {
  end: string;
  start: string;
};

const EXPORT_PADDING = 180;
const GRID_SIZE = 44;
const MAX_EXPORT_CANVAS_EDGE = 8192;
const MAX_EXPORT_CANVAS_PIXELS = 33_554_432;
const PDF_MARGIN = 24;
const PX_TO_PT = 0.75;
const FONT_FAMILY = "'SF Pro Display', 'Segoe UI Variable', 'Avenir Next', sans-serif";
const TITLE_FONT = `600 16px ${FONT_FAMILY}`;
const NOTES_FONT = `400 13px ${FONT_FAMILY}`;
const BADGE_FONT = `600 11px ${FONT_FAMILY}`;

const EXPORT_NODE_GRADIENTS: Record<NodeColor, NodeGradient> = {
  slate: {
    start: "#495a81",
    end: "#232d46",
  },
  teal: {
    start: "#21777a",
    end: "#0d4c54",
  },
  amber: {
    start: "#966516",
    end: "#6b3e06",
  },
  coral: {
    start: "#a04946",
    end: "#762a33",
  },
  violet: {
    start: "#6041ab",
    end: "#38256f",
  },
};

let measurementContext: CanvasRenderingContext2D | null = null;

export async function buildMindMapExportBlob(
  document: MindMapDocument,
  format: ExportFormat,
): Promise<Blob> {
  const snapshot = buildExportSnapshot(document);
  const svgMarkup = buildSvgMarkup(snapshot);

  if (format === "svg") {
    return new Blob([svgMarkup], {
      type: "image/svg+xml;charset=utf-8",
    });
  }

  const canvas = await renderSnapshotToCanvas(snapshot, svgMarkup);

  if (format === "png") {
    return await canvasToBlob(canvas, "image/png");
  }

  const jpegBlob = await canvasToBlob(canvas, "image/jpeg", 0.92);
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const pdfBytes = buildPdfFromJpeg({
    jpegBytes,
    imageHeight: canvas.height,
    imageWidth: canvas.width,
    pageHeight: snapshot.height * PX_TO_PT + PDF_MARGIN * 2,
    pageWidth: snapshot.width * PX_TO_PT + PDF_MARGIN * 2,
  });

  return new Blob([pdfBytes], {
    type: "application/pdf",
  });
}

function buildExportSnapshot(document: MindMapDocument): ExportSnapshot {
  const nodeIds = getSubtreeIds(document, document.rootId).filter(
    (nodeId) => document.nodes[nodeId],
  );
  const positions = Object.fromEntries(
    nodeIds.map((nodeId) => {
      const node = document.nodes[nodeId];

      return [
        nodeId,
        {
          x: node.x,
          y: node.y,
        },
      ];
    }),
  ) as Record<string, Position>;

  if (nodeIds.length === 0) {
    return {
      connectors: [],
      height: NODE_HEIGHT + EXPORT_PADDING * 2,
      nodes: [],
      width: NODE_WIDTH + EXPORT_PADDING * 2,
    };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const nodeId of nodeIds) {
    const position = positions[nodeId];

    minX = Math.min(minX, position.x);
    minY = Math.min(minY, position.y);
    maxX = Math.max(maxX, position.x + NODE_WIDTH);
    maxY = Math.max(maxY, position.y + NODE_HEIGHT);
  }

  const offsetX = EXPORT_PADDING - minX;
  const offsetY = EXPORT_PADDING - minY;
  const normalizedPositions = Object.fromEntries(
    Object.entries(positions).map(([nodeId, position]) => [
      nodeId,
      {
        x: position.x + offsetX,
        y: position.y + offsetY,
      },
    ]),
  ) as Record<string, Position>;
  const nodes = nodeIds.map((nodeId) => ({
    node: document.nodes[nodeId],
    x: normalizedPositions[nodeId].x,
    y: normalizedPositions[nodeId].y,
  }));
  const connectors = nodeIds
    .filter((nodeId) => nodeId !== document.rootId)
    .map((nodeId) => {
      const node = document.nodes[nodeId];

      if (!node.parentId) {
        return null;
      }

      const parentPosition = normalizedPositions[node.parentId];
      const childPosition = normalizedPositions[nodeId];

      if (!parentPosition || !childPosition) {
        return null;
      }

      return {
        color: NODE_COLORS[node.color].accent,
        path: createConnectorPath(
          parentPosition,
          childPosition,
          getBranchDirection(document, nodeId),
          CONNECTOR_CURVE_OFFSET,
        ),
      };
    })
    .filter(
      (
        connector,
      ): connector is {
        color: string;
        path: string;
      } => connector !== null,
    );

  return {
    connectors,
    height: Math.ceil(maxY - minY + EXPORT_PADDING * 2),
    nodes,
    width: Math.ceil(maxX - minX + EXPORT_PADDING * 2),
  };
}

function buildSvgMarkup(snapshot: ExportSnapshot): string {
  const connectorMarkup = snapshot.connectors
    .map(
      (connector) => `
        <path
          d="${escapeXml(connector.path)}"
          fill="none"
          stroke="${connector.color}"
          stroke-linecap="round"
          stroke-width="3"
          stroke-opacity="0.78"
        />
      `,
    )
    .join("");
  const nodeMarkup = snapshot.nodes.map(buildNodeMarkup).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${snapshot.width}"
  height="${snapshot.height}"
  viewBox="0 0 ${snapshot.width} ${snapshot.height}"
  role="img"
>
  <defs>
    <linearGradient id="mindora-export-bg" x1="0%" x2="0%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#0a101c" />
      <stop offset="100%" stop-color="#08101a" />
    </linearGradient>
    <radialGradient id="mindora-export-glow" cx="0%" cy="0%" r="58%">
      <stop offset="0%" stop-color="#3c5a98" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#3c5a98" stop-opacity="0" />
    </radialGradient>
    <pattern
      id="mindora-export-grid"
      width="${GRID_SIZE}"
      height="${GRID_SIZE}"
      patternUnits="userSpaceOnUse"
    >
      <path
        d="M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}"
        fill="none"
        stroke="#ffffff"
        stroke-opacity="0.03"
        stroke-width="1"
      />
    </pattern>
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

  <rect width="${snapshot.width}" height="${snapshot.height}" fill="url(#mindora-export-bg)" />
  <rect width="${snapshot.width}" height="${snapshot.height}" fill="url(#mindora-export-glow)" />
  <rect width="${snapshot.width}" height="${snapshot.height}" fill="url(#mindora-export-grid)" />

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

function buildNodeMarkup(snapshotNode: ExportSnapshot["nodes"][number]): string {
  const { node, x, y } = snapshotNode;
  const hasChildren = node.childrenIds.length > 0;
  const titleWidth = NODE_WIDTH - 36 - (hasChildren ? 60 : 0);
  const noteWidth = NODE_WIDTH - 36;
  const titleLines = wrapText(
    node.title.trim() || "Untitled Node",
    titleWidth,
    TITLE_FONT,
    node.notes ? 2 : 3,
  );
  const noteLines = node.notes
    ? wrapText(node.notes.trim(), noteWidth, NOTES_FONT, 2)
    : [];
  const titleMarkup = buildTextBlockMarkup({
    baselineY: 34,
    color: "#f5f7ff",
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 18,
    lines: titleLines,
    opacity: 1,
    x: 18,
  });
  const notesMarkup =
    noteLines.length > 0
      ? buildTextBlockMarkup({
          baselineY: 34 + (titleLines.length - 1) * 18 + 22,
          color: "#f1f4ff",
          fontFamily: FONT_FAMILY,
          fontSize: 13,
          fontWeight: 400,
          lineHeight: 16,
          lines: noteLines,
          opacity: 0.8,
          x: 18,
        })
      : "";

  return `
    <g transform="translate(${x} ${y})" filter="url(#mindora-node-shadow)">
      <rect
        width="${NODE_WIDTH}"
        height="${NODE_HEIGHT}"
        rx="18"
        fill="url(#mindora-node-fill-${node.color})"
        stroke="#ffffff"
        stroke-opacity="0.11"
      />
      ${titleMarkup}
      ${notesMarkup}
      ${hasChildren ? buildNodeBadgeMarkup(node) : ""}
    </g>
  `;
}

function buildNodeBadgeMarkup(node: MindMapNode): string {
  const badgeLabel = String(node.childrenIds.length);
  const iconLabel = node.collapsed ? "+" : "-";
  const badgeTextWidth = measureTextWidth(badgeLabel, BADGE_FONT);
  const badgeWidth = Math.max(36, Math.ceil(34 + badgeTextWidth));
  const badgeX = NODE_WIDTH - badgeWidth - 10;
  const iconCircleX = badgeX + 11;
  const countX = badgeX + 22;

  return `
    <g>
      <rect
        x="${badgeX}"
        y="10"
        width="${badgeWidth}"
        height="24"
        rx="12"
        fill="#080e18"
        fill-opacity="0.36"
        stroke="#ffffff"
        stroke-opacity="0.14"
      />
      <circle
        cx="${iconCircleX}"
        cy="22"
        r="8"
        fill="#ffffff"
        fill-opacity="0.1"
      />
      <text
        x="${iconCircleX}"
        y="25"
        fill="#ffffff"
        fill-opacity="0.92"
        font-family="${FONT_FAMILY}"
        font-size="11"
        font-weight="600"
        text-anchor="middle"
      >${iconLabel}</text>
      <text
        x="${countX}"
        y="25"
        fill="#ffffff"
        fill-opacity="0.82"
        font-family="${FONT_FAMILY}"
        font-size="11"
        font-weight="600"
      >${escapeXml(badgeLabel)}</text>
    </g>
  `;
}

function buildTextBlockMarkup(params: {
  baselineY: number;
  color: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  lines: string[];
  opacity: number;
  x: number;
}): string {
  const {
    baselineY,
    color,
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    lines,
    opacity,
    x,
  } = params;

  if (lines.length === 0) {
    return "";
  }

  const tspans = lines
    .map(
      (line, index) => `
        <tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>
      `,
    )
    .join("");

  return `
    <text
      x="${x}"
      y="${baselineY}"
      fill="${color}"
      fill-opacity="${opacity}"
      font-family="${fontFamily}"
      font-size="${fontSize}"
      font-weight="${fontWeight}"
    >${tspans}
    </text>
  `;
}

function wrapText(
  value: string,
  maxWidth: number,
  font: string,
  maxLines: number,
): string[] {
  const normalizedValue = value.replace(/\r/g, "");
  if (!normalizedValue.trim() || maxLines <= 0) {
    return [];
  }

  const lines: string[] = [];
  const paragraphs = normalizedValue.split("\n");
  let truncated = false;

  for (const paragraph of paragraphs) {
    if (lines.length >= maxLines) {
      truncated = true;
      break;
    }

    const normalizedParagraph = paragraph.trim().replace(/\s+/g, " ");
    if (!normalizedParagraph) {
      continue;
    }

    const paragraphLines = splitParagraphIntoLines(
      normalizedParagraph,
      maxWidth,
      font,
    );

    for (const line of paragraphLines) {
      if (lines.length >= maxLines) {
        truncated = true;
        break;
      }

      lines.push(line);
    }

    if (truncated) {
      break;
    }
  }

  if (lines.length === 0) {
    return [];
  }

  if (truncated) {
    lines[lines.length - 1] = ellipsizeText(lines[lines.length - 1], maxWidth, font);
  }

  return lines;
}

function splitParagraphIntoLines(
  paragraph: string,
  maxWidth: number,
  font: string,
): string[] {
  const words = paragraph.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (measureTextWidth(candidate, font) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = "";
    }

    if (measureTextWidth(word, font) <= maxWidth) {
      currentLine = word;
      continue;
    }

    const segments = splitLongWord(word, maxWidth, font);
    currentLine = segments.pop() ?? "";
    lines.push(...segments);
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function splitLongWord(
  word: string,
  maxWidth: number,
  font: string,
): string[] {
  const segments: string[] = [];
  let currentSegment = "";

  for (const character of Array.from(word)) {
    const candidate = `${currentSegment}${character}`;
    if (!currentSegment || measureTextWidth(candidate, font) <= maxWidth) {
      currentSegment = candidate;
      continue;
    }

    segments.push(currentSegment);
    currentSegment = character;
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
}

function ellipsizeText(value: string, maxWidth: number, font: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "...";
  }

  if (measureTextWidth(`${trimmedValue}...`, font) <= maxWidth) {
    return `${trimmedValue}...`;
  }

  let result = trimmedValue;

  while (result.length > 0) {
    result = result.slice(0, -1).trimEnd();
    if (!result) {
      break;
    }

    if (measureTextWidth(`${result}...`, font) <= maxWidth) {
      return `${result}...`;
    }
  }

  return "...";
}

function measureTextWidth(value: string, font: string): number {
  const context = getMeasurementContext();
  context.font = font;
  return context.measureText(value).width;
}

function getMeasurementContext(): CanvasRenderingContext2D {
  if (measurementContext) {
    return measurementContext;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to measure export text.");
  }

  measurementContext = context;
  return context;
}

async function renderSnapshotToCanvas(
  snapshot: ExportSnapshot,
  svgMarkup: string,
): Promise<HTMLCanvasElement> {
  const rasterScale = getRasterScale(snapshot.width, snapshot.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(snapshot.width * rasterScale));
  canvas.height = Math.max(1, Math.round(snapshot.height * rasterScale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create an export canvas.");
  }

  const svgBlob = new Blob([svgMarkup], {
    type: "image/svg+xml;charset=utf-8",
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);
    context.imageSmoothingEnabled = true;
    context.scale(rasterScale, rasterScale);
    context.drawImage(image, 0, 0, snapshot.width, snapshot.height);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }

  return canvas;
}

function getRasterScale(width: number, height: number): number {
  const desiredScale = 2;
  const edgeScale = Math.min(
    MAX_EXPORT_CANVAS_EDGE / Math.max(width, 1),
    MAX_EXPORT_CANVAS_EDGE / Math.max(height, 1),
  );
  const pixelScale = Math.sqrt(
    MAX_EXPORT_CANVAS_PIXELS / Math.max(width * height, 1),
  );

  return Math.min(desiredScale, edgeScale, pixelScale);
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => {
      reject(new Error("Unable to render the export preview."));
    };
    image.src = url;
  });
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to encode the exported file."));
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function buildPdfFromJpeg(params: {
  imageHeight: number;
  imageWidth: number;
  jpegBytes: Uint8Array;
  pageHeight: number;
  pageWidth: number;
}): Uint8Array {
  const { imageHeight, imageWidth, jpegBytes, pageHeight, pageWidth } = params;
  const drawWidth = pageWidth - PDF_MARGIN * 2;
  const drawHeight = pageHeight - PDF_MARGIN * 2;
  const contentStream = [
    "q",
    `${formatPdfNumber(drawWidth)} 0 0 ${formatPdfNumber(drawHeight)} ${PDF_MARGIN} ${PDF_MARGIN} cm`,
    "/Im0 Do",
    "Q",
  ].join("\n");
  const objects: Uint8Array[] = [
    encodePdfChunk("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"),
    encodePdfChunk("2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n"),
    encodePdfChunk(
      `3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${formatPdfNumber(pageWidth)} ${formatPdfNumber(pageHeight)}]
/Resources << /XObject << /Im0 4 0 R >> >>
/Contents 5 0 R
>>
endobj
`,
    ),
    concatPdfChunks([
      encodePdfChunk(
        `4 0 obj
<<
/Type /XObject
/Subtype /Image
/Width ${imageWidth}
/Height ${imageHeight}
/ColorSpace /DeviceRGB
/BitsPerComponent 8
/Filter /DCTDecode
/Length ${jpegBytes.length}
>>
stream
`,
      ),
      jpegBytes,
      encodePdfChunk("\nendstream\nendobj\n"),
    ]),
    encodePdfChunk(
      `5 0 obj
<< /Length ${contentStream.length} >>
stream
${contentStream}
endstream
endobj
`,
    ),
  ];

  const chunks: Uint8Array[] = [
    new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 255, 255, 255, 255, 10]),
  ];
  const offsets: number[] = [0];
  let currentOffset = chunks[0].length;

  for (const object of objects) {
    offsets.push(currentOffset);
    chunks.push(object);
    currentOffset += object.length;
  }

  const xrefOffset = currentOffset;
  const xrefRows = offsets
    .map((offset, index) =>
      index === 0 ? "0000000000 65535 f " : `${offset.toString().padStart(10, "0")} 00000 n `,
    )
    .join("\n");
  const trailer = `xref
0 ${offsets.length}
${xrefRows}
trailer
<< /Size ${offsets.length} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`;

  chunks.push(encodePdfChunk(trailer));
  return concatPdfChunks(chunks);
}

function formatPdfNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function encodePdfChunk(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function concatPdfChunks(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
