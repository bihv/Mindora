import type { MindMapBackgroundPresetId } from "./backgroundPresets/presetCatalog";

export type NodeColor = "slate" | "teal" | "amber" | "coral" | "violet";

export const MINDMAP_CARD_LAYOUT = "mindmap-card";
export const MINDMAP_LINE_LAYOUT = "mindmap-line";
export const LOGIC_CHART_CARD_LAYOUT = "logic-chart-card";
export const LOGIC_CHART_LINE_LAYOUT = "logic-chart-line";

export const MINDMAP_LAYOUT_TYPES = [
  MINDMAP_CARD_LAYOUT,
  MINDMAP_LINE_LAYOUT,
  LOGIC_CHART_CARD_LAYOUT,
  LOGIC_CHART_LINE_LAYOUT,
] as const;

export type MindMapLayoutType = (typeof MINDMAP_LAYOUT_TYPES)[number];

export const DEFAULT_MINDMAP_LAYOUT_TYPE: MindMapLayoutType =
  MINDMAP_CARD_LAYOUT;

export function isMindMapLayoutType(
  value: unknown,
): value is MindMapLayoutType {
  return (
    typeof value === "string" &&
    MINDMAP_LAYOUT_TYPES.includes(value as MindMapLayoutType)
  );
}

export function isClassicMindMapLayoutType(
  layoutType: MindMapLayoutType,
): boolean {
  return (
    layoutType === MINDMAP_CARD_LAYOUT || layoutType === MINDMAP_LINE_LAYOUT
  );
}

export function isLogicChartLayoutType(
  layoutType: MindMapLayoutType,
): boolean {
  return (
    layoutType === LOGIC_CHART_CARD_LAYOUT ||
    layoutType === LOGIC_CHART_LINE_LAYOUT
  );
}

export const MINDMAP_NODE_KINDS = ["text", "image", "link", "emoji"] as const;

export type MindMapNodeKind = (typeof MINDMAP_NODE_KINDS)[number];

export function isMindMapNodeKind(value: unknown): value is MindMapNodeKind {
  return (
    typeof value === "string" &&
    MINDMAP_NODE_KINDS.includes(value as MindMapNodeKind)
  );
}

export type MindMapNodeDataByKind = {
  text: Record<string, never>;
  image: { imageUrl: string };
  link: { url: string };
  emoji: { emoji: string };
};

export type MindMapNodeData = MindMapNodeDataByKind[MindMapNodeKind];

export const MINDMAP_NODE_KIND_LABELS: Record<MindMapNodeKind, string> = {
  text: "Text",
  image: "Image",
  link: "Link",
  emoji: "Emoji",
};

export type MindMapNode = {
  id: string;
  title: string;
  notes: string;
  kind: MindMapNodeKind;
  data: MindMapNodeData;
  color: NodeColor;
  classicDirection?: -1 | 1;
  x: number;
  y: number;
  parentId: string | null;
  childrenIds: string[];
  collapsed: boolean;
};

export type MindMapDocument = {
  id: string;
  title: string;
  rootId: string;
  nodes: Record<string, MindMapNode>;
  layoutType?: MindMapLayoutType;
  backgroundPresetId?: MindMapBackgroundPresetId;
};

export type MindMapTemplate = {
  id: string;
  name: string;
  description: string;
  create: () => MindMapDocument;
};

export type StoredMindMapDraft = {
  document: MindMapDocument;
  draftBaselineSnapshot: string | null;
  fileHandlePath: string | null;
  fileName: string | null;
  lastSavedSnapshot: string | null;
  updatedAt: number | null;
};

export const NODE_COLORS: Record<
  NodeColor,
  { label: string; accent: string; surface: string; glow: string }
> = {
  slate: {
    label: "Slate",
    accent: "#8fa0c7",
    surface:
      "linear-gradient(135deg, rgba(73, 90, 129, 0.9), rgba(35, 45, 70, 0.95))",
    glow: "rgba(128, 148, 204, 0.38)",
  },
  teal: {
    label: "Teal",
    accent: "#61d8c4",
    surface:
      "linear-gradient(135deg, rgba(33, 119, 122, 0.95), rgba(13, 76, 84, 0.96))",
    glow: "rgba(72, 217, 198, 0.34)",
  },
  amber: {
    label: "Amber",
    accent: "#f7c86b",
    surface:
      "linear-gradient(135deg, rgba(150, 101, 22, 0.95), rgba(107, 62, 6, 0.96))",
    glow: "rgba(247, 198, 72, 0.3)",
  },
  coral: {
    label: "Coral",
    accent: "#ff9f8d",
    surface:
      "linear-gradient(135deg, rgba(160, 73, 70, 0.94), rgba(118, 42, 51, 0.96))",
    glow: "rgba(255, 133, 145, 0.32)",
  },
  violet: {
    label: "Violet",
    accent: "#b89cff",
    surface:
      "linear-gradient(135deg, rgba(96, 65, 171, 0.94), rgba(56, 37, 111, 0.98))",
    glow: "rgba(173, 146, 255, 0.34)",
  },
};
