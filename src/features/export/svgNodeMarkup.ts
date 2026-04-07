import {
  LOGIC_CHART_FONT_FAMILY,
  LOGIC_CHART_BRANCH_FONT,
  LOGIC_CHART_TITLE_FONT,
  MINDMAP_LINE_BRANCH_FONT,
  NOTES_FONT,
  TITLE_FONT,
  type ExportSnapshot,
} from "./config";
import {
  getMindMapNodeDisplayTitle,
  getMindMapNodeEmoji,
  getMindMapNodeLineTitle,
  getMindMapNodeLinkUrl,
  getMindMapNodeMediaUrl,
} from "../../domain/mindmap/nodeContent";
import {
  LOGIC_CHART_LINE_LAYOUT,
  MINDMAP_LINE_LAYOUT,
  MINDMAP_NODE_KIND_LABELS,
  NODE_COLORS,
} from "../../domain/mindmap/model";
import type { MindMapNode } from "../../domain/mindmap/model";
import { NODE_WIDTH } from "../editor/constants";
import {
  BADGE_FONT,
  FONT_FAMILY,
  buildTextBlockMarkup,
  escapeXml,
  measureTextWidth,
  wrapText,
} from "./svgTextLayout";

export function buildNodeMarkup(
  snapshotNode: ExportSnapshot["nodes"][number],
  layoutType: ExportSnapshot["layoutType"],
): string {
  if (layoutType === LOGIC_CHART_LINE_LAYOUT) {
    return buildLogicChartNodeMarkup(snapshotNode);
  }

  if (layoutType === MINDMAP_LINE_LAYOUT) {
    return buildMindMapLineNodeMarkup(snapshotNode);
  }

  return buildMindMapNodeMarkup(snapshotNode);
}

function buildMindMapNodeMarkup(
  snapshotNode: ExportSnapshot["nodes"][number],
): string {
  const { height, node, x, y } = snapshotNode;
  const hasChildren = node.childrenIds.length > 0;
  const title = getMindMapNodeDisplayTitle(node);
  const secondaryText = getExportNodeSecondaryText(node);
  const titleWidth = NODE_WIDTH - 36 - (hasChildren ? 60 : 0);
  const noteWidth = NODE_WIDTH - 36;
  const titleLines = wrapText(
    title,
    titleWidth,
    TITLE_FONT,
    secondaryText ? 2 : 3,
  );
  const noteLines = secondaryText
    ? wrapText(secondaryText, noteWidth, NOTES_FONT, 2)
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
        height="${height}"
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

function buildLogicChartNodeMarkup(
  snapshotNode: ExportSnapshot["nodes"][number],
): string {
  const { node, x, y } = snapshotNode;
  const title = escapeXml(getMindMapNodeLineTitle(node));
  const isRoot = node.parentId === null;
  const accent = NODE_COLORS[node.color].accent;
  const font = isRoot ? LOGIC_CHART_TITLE_FONT : LOGIC_CHART_BRANCH_FONT;
  const titleWidth = Math.min(
    measureTextWidth(getMindMapNodeLineTitle(node), font),
    NODE_WIDTH - 20,
  );
  const textX = 0;
  const textY = isRoot ? 42 : 38;
  const lineStartX = Math.min(titleWidth + 18, NODE_WIDTH - 24);

  return `
    <g transform="translate(${x} ${y})">
      <text
        fill="${isRoot ? "#ffffff" : "#f5f7ff"}"
        font-family="${LOGIC_CHART_FONT_FAMILY}"
        font-size="${isRoot ? 30 : 18}"
        font-weight="${isRoot ? 700 : 600}"
        x="${textX}"
        y="${textY}"
      >${title}</text>
      ${
        isRoot
          ? ""
          : `
      <line
        stroke="${accent}"
        stroke-linecap="round"
        stroke-opacity="0.92"
        stroke-width="3.4"
        x1="${lineStartX}"
        x2="${NODE_WIDTH}"
        y1="${textY + 6}"
        y2="${textY + 6}"
      />
      `
      }
    </g>
  `;
}

function buildMindMapLineNodeMarkup(
  snapshotNode: ExportSnapshot["nodes"][number],
): string {
  const { direction, node, x, y } = snapshotNode;
  const lineTitle = getMindMapNodeLineTitle(node);
  const title = escapeXml(lineTitle);
  const isRoot = node.parentId === null;
  const accent = NODE_COLORS[node.color].accent;

  if (isRoot) {
    return `
    <g transform="translate(${x} ${y})">
      <text
        fill="#ffffff"
        font-family="${LOGIC_CHART_FONT_FAMILY}"
        font-size="30"
        font-weight="700"
        text-anchor="middle"
        x="${NODE_WIDTH / 2}"
        y="44"
      >${title}</text>
    </g>
  `;
  }

  const titleWidth = Math.min(
    measureTextWidth(lineTitle, MINDMAP_LINE_BRANCH_FONT),
    NODE_WIDTH - 20,
  );
  const textY = 38;

  if (direction === -1) {
    const lineEndX = Math.max(0, NODE_WIDTH - titleWidth - 18);

    return `
    <g transform="translate(${x} ${y})">
      <line
        stroke="${accent}"
        stroke-linecap="round"
        stroke-opacity="0.92"
        stroke-width="3.4"
        x1="0"
        x2="${lineEndX}"
        y1="${textY + 6}"
        y2="${textY + 6}"
      />
      <text
        fill="#f5f7ff"
        font-family="${LOGIC_CHART_FONT_FAMILY}"
        font-size="18"
        font-weight="600"
        text-anchor="end"
        x="${NODE_WIDTH}"
        y="${textY}"
      >${title}</text>
    </g>
  `;
  }

  const lineStartX = Math.min(titleWidth + 18, NODE_WIDTH - 24);

  return `
    <g transform="translate(${x} ${y})">
      <text
        fill="#f5f7ff"
        font-family="${LOGIC_CHART_FONT_FAMILY}"
        font-size="18"
        font-weight="600"
        x="0"
        y="${textY}"
      >${title}</text>
      <line
        stroke="${accent}"
        stroke-linecap="round"
        stroke-opacity="0.92"
        stroke-width="3.4"
        x1="${lineStartX}"
        x2="${NODE_WIDTH}"
        y1="${textY + 6}"
        y2="${textY + 6}"
      />
    </g>
  `;
}

function getExportNodeSecondaryText(node: MindMapNode): string {
  if (node.kind === "text") {
    return node.notes.trim();
  }

  if (node.kind === "link") {
    return getMindMapNodeLinkUrl(node) || node.notes.trim();
  }

  if (node.kind === "emoji") {
    return node.notes.trim() || getMindMapNodeEmoji(node) || "Emoji node";
  }

  const mediaUrl = getMindMapNodeMediaUrl(node);
  return (
    node.notes.trim() ||
    mediaUrl ||
    `${MINDMAP_NODE_KIND_LABELS[node.kind]} node`
  );
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
