import {
  LOGIC_CHART_LINE_LAYOUT,
  MINDMAP_LINE_LAYOUT,
  type MindMapLayoutType,
  type MindMapNode,
} from "./model";
import {
  NODE_CARD_HEIGHT,
  NODE_LINE_HEIGHT,
  NODE_WIDTH,
} from "./layoutMetrics";
import {
  getMindMapNodeDetailText,
  getMindMapNodeDisplayTitle,
  getMindMapNodeLinkUrl,
} from "./nodeContent";

export function getNodeHeightForLayout(
  layoutType: MindMapLayoutType,
  node?: MindMapNode,
): number {
  if (
    layoutType === MINDMAP_LINE_LAYOUT ||
    layoutType === LOGIC_CHART_LINE_LAYOUT
  ) {
    return NODE_LINE_HEIGHT;
  }

  if (!node) {
    return NODE_CARD_HEIGHT;
  }

  return getMindMapCardNodeHeight(node);
}

export function getNodeSizeForLayout(
  layoutType: MindMapLayoutType,
  node?: MindMapNode,
): { width: number; height: number } {
  return {
    width: NODE_WIDTH,
    height: getNodeHeightForLayout(layoutType, node),
  };
}

function getMindMapCardNodeHeight(node: MindMapNode): number {
  const titleLines = estimateTextLineCount(getMindMapNodeDisplayTitle(node), 16, 2);
  const detailText = getMindMapNodeDetailText(node);
  const detailLines =
    node.kind === "text" && !detailText
      ? 0
      : estimateTextLineCount(
          detailText,
          node.kind === "link" ? 26 : 22,
          2,
        );

  switch (node.kind) {
    case "image":
      return clampNodeHeight(92 + titleLines * 20 + detailLines * 18, 120, 164);
    case "link":
      return clampNodeHeight(
        68 +
          titleLines * 20 +
          detailLines * 18 +
          (getMindMapNodeLinkUrl(node) ? 42 : 0),
        122,
        176,
      );
    case "emoji":
      return clampNodeHeight(88 + titleLines * 20 + detailLines * 18, 120, 164);
    case "text":
    default:
      return clampNodeHeight(
        96 + titleLines * 22 + detailLines * 18 + (detailLines > 0 ? 8 : 0),
        120,
        176,
      );
  }
}

function estimateTextLineCount(
  value: string,
  charsPerLine: number,
  maxLines: number,
): number {
  const normalizedValue = value.replace(/\r/g, "").trim();
  if (!normalizedValue) {
    return 0;
  }

  const paragraphs = normalizedValue.split("\n");
  let totalLines = 0;

  for (const paragraph of paragraphs) {
    if (totalLines >= maxLines) {
      break;
    }

    const normalizedParagraph = paragraph.trim().replace(/\s+/g, " ");
    if (!normalizedParagraph) {
      continue;
    }

    totalLines += Math.max(
      1,
      Math.ceil(normalizedParagraph.length / charsPerLine),
    );
  }

  return Math.max(1, Math.min(totalLines, maxLines));
}

function clampNodeHeight(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
