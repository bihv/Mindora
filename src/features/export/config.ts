import type {
  MindMapLayoutType,
  MindMapNode,
  NodeColor,
} from "../../domain/mindmap/model";
import type { MindMapBackgroundPresetId } from "../../domain/mindmap/backgroundPresets/presetCatalog";

export type ExportSnapshot = {
  backgroundPresetId: MindMapBackgroundPresetId;
  connectors: Array<{
    color: string;
    path: string;
  }>;
  height: number;
  layoutType: MindMapLayoutType;
  nodes: Array<{
    direction: -1 | 1;
    height: number;
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

export const EXPORT_PADDING = 180;
export const MAX_EXPORT_CANVAS_EDGE = 8192;
export const MAX_EXPORT_CANVAS_PIXELS = 33_554_432;
export const PDF_MARGIN = 24;
export const PX_TO_PT = 0.75;
export const FONT_FAMILY =
  "'SF Pro Display', 'Segoe UI Variable', 'Avenir Next', sans-serif";
export const TITLE_FONT = `600 16px ${FONT_FAMILY}`;
export const NOTES_FONT = `400 13px ${FONT_FAMILY}`;
export const BADGE_FONT = `600 11px ${FONT_FAMILY}`;
export const LOGIC_CHART_FONT_FAMILY =
  "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', serif";
export const LOGIC_CHART_TITLE_FONT = `700 28px ${LOGIC_CHART_FONT_FAMILY}`;
export const LOGIC_CHART_BRANCH_FONT = `600 17px ${LOGIC_CHART_FONT_FAMILY}`;
export const MINDMAP_LINE_BRANCH_FONT = `600 18px ${LOGIC_CHART_FONT_FAMILY}`;

export const EXPORT_NODE_GRADIENTS: Record<NodeColor, NodeGradient> = {
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
