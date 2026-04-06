import {
  DEFAULT_MINDMAP_BACKGROUND_PRESET_ID,
  isMindMapBackgroundPresetId,
  type MindMapBackgroundPresetId,
} from "./features/editor/backgroundPresets";
import {
  NODE_CARD_HEIGHT,
  NODE_LINE_HEIGHT,
  NODE_WIDTH,
} from "./features/editor/constants";

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
export const MINDMAP_NODE_KINDS = [
  "text",
  "image",
  "link",
  "emoji",
] as const;
export type MindMapNodeKind = (typeof MINDMAP_NODE_KINDS)[number];
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

export const STORAGE_KEY = "mindora:mvp-document";
export const TEMPLATE_KEY = "mindora:active-template";
export const DEFAULT_MINDMAP_LAYOUT_TYPE: MindMapLayoutType = MINDMAP_CARD_LAYOUT;

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

export function getNodeHeightForLayout(
  layoutType: MindMapLayoutType,
  node?: MindMapNode,
): number {
  if (layoutType === MINDMAP_LINE_LAYOUT || layoutType === LOGIC_CHART_LINE_LAYOUT) {
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

export const NODE_COLORS: Record<
  NodeColor,
  { label: string; accent: string; surface: string; glow: string }
> = {
  slate: {
    label: "Slate",
    accent: "#8fa0c7",
    surface: "linear-gradient(135deg, rgba(73, 90, 129, 0.9), rgba(35, 45, 70, 0.95))",
    glow: "rgba(128, 148, 204, 0.38)",
  },
  teal: {
    label: "Teal",
    accent: "#61d8c4",
    surface: "linear-gradient(135deg, rgba(33, 119, 122, 0.95), rgba(13, 76, 84, 0.96))",
    glow: "rgba(72, 217, 198, 0.34)",
  },
  amber: {
    label: "Amber",
    accent: "#f7c86b",
    surface: "linear-gradient(135deg, rgba(150, 101, 22, 0.95), rgba(107, 62, 6, 0.96))",
    glow: "rgba(247, 198, 72, 0.3)",
  },
  coral: {
    label: "Coral",
    accent: "#ff9f8d",
    surface: "linear-gradient(135deg, rgba(160, 73, 70, 0.94), rgba(118, 42, 51, 0.96))",
    glow: "rgba(255, 133, 145, 0.32)",
  },
  violet: {
    label: "Violet",
    accent: "#b89cff",
    surface: "linear-gradient(135deg, rgba(96, 65, 171, 0.94), rgba(56, 37, 111, 0.98))",
    glow: "rgba(173, 146, 255, 0.34)",
  },
};

const ROOT_X = 1460;
const ROOT_Y = 860;
const HORIZONTAL_GAP = 300;
const VERTICAL_GAP = 200;

type CreateMindMapNodeParams = Pick<
  MindMapNode,
  "title" | "x" | "y" | "parentId" | "color"
> &
  Partial<Omit<MindMapNode, "id" | "title" | "x" | "y" | "parentId" | "color">>;

export function createDefaultMindMapNodeData(
  kind: MindMapNodeKind,
): MindMapNodeData {
  switch (kind) {
    case "image":
      return { imageUrl: "" };
    case "link":
      return { url: "" };
    case "emoji":
      return { emoji: "" };
    case "text":
    default:
      return {};
  }
}

export function hydrateMindMapNode(node: MindMapNode): MindMapNode {
  const rawKind = node.kind as unknown;
  const kind = isMindMapNodeKind(rawKind) ? rawKind : "text";
  const rawData = (node as Partial<MindMapNode>).data;
  const data = normalizeMindMapNodeData(kind, rawData);

  if (
    rawKind === kind &&
    isMindMapNodeDataEquivalent(kind, rawData, data)
  ) {
    return node;
  }

  return {
    ...node,
    kind,
    data,
  };
}

export function setMindMapNodeKind(
  node: MindMapNode,
  kind: MindMapNodeKind,
): MindMapNode {
  if (node.kind === kind) {
    return node;
  }

  return {
    ...node,
    kind,
    data: convertMindMapNodeData(node, kind),
  };
}

export function getMindMapNodeMediaUrl(node: MindMapNode): string {
  return node.kind === "image"
    ? normalizeMindMapNodeData("image", node.data).imageUrl.trim()
    : "";
}

export function getMindMapNodeLinkUrl(node: MindMapNode): string {
  if (node.kind !== "link") {
    return "";
  }

  return normalizeMindMapNodeData("link", node.data).url.trim();
}

export function getMindMapNodeEmoji(node: MindMapNode): string {
  if (node.kind !== "emoji") {
    return "";
  }

  return normalizeMindMapNodeData("emoji", node.data).emoji.trim();
}

export function getMindMapNodeDisplayTitle(node: MindMapNode): string {
  const trimmedTitle = node.title.trim();
  if (trimmedTitle) {
    return trimmedTitle;
  }

  if (node.kind === "link") {
    return getMindMapNodeLinkUrl(node) || MINDMAP_NODE_KIND_LABELS.link;
  }

  if (node.kind === "emoji") {
    const emoji = getMindMapNodeEmoji(node);
    return emoji ? `Emoji ${emoji}` : MINDMAP_NODE_KIND_LABELS.emoji;
  }

  return MINDMAP_NODE_KIND_LABELS[node.kind];
}

export function getMindMapNodeDetailText(node: MindMapNode): string {
  if (node.kind === "text") {
    return node.notes.trim();
  }

  if (node.kind === "image") {
    return (node.notes || getMindMapNodeMediaUrl(node) || "Add an image source").trim();
  }

  if (node.kind === "link") {
    return (
      node.notes || getMindMapNodeLinkUrl(node) || "Add a destination URL"
    ).trim();
  }

  return (node.notes || "Emoji node").trim();
}

export function getMindMapNodeLineTitle(node: MindMapNode): string {
  return getMindMapNodeDisplayTitle(node);
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
        68 + titleLines * 20 + detailLines * 18 + (getMindMapNodeLinkUrl(node) ? 42 : 0),
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

    totalLines += Math.max(1, Math.ceil(normalizedParagraph.length / charsPerLine));
  }

  return Math.max(1, Math.min(totalLines, maxLines));
}

function clampNodeHeight(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getMindMapNodeSearchTexts(node: MindMapNode): string[] {
  const values = [
    node.title,
    node.notes,
    MINDMAP_NODE_KIND_LABELS[node.kind],
  ];

  const mediaUrl = getMindMapNodeMediaUrl(node);
  if (mediaUrl) {
    values.push(mediaUrl);
  }

  const linkUrl = getMindMapNodeLinkUrl(node);
  if (linkUrl) {
    values.push(linkUrl);
  }

  const emoji = getMindMapNodeEmoji(node);
  if (emoji) {
    values.push(emoji);
  }

  return values;
}

export function normalizeExternalUrl(value: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmedValue)) {
    return trimmedValue;
  }

  if (trimmedValue.startsWith("//")) {
    return `https:${trimmedValue}`;
  }

  return `https://${trimmedValue}`;
}

export function createMindMapNode(
  params: CreateMindMapNodeParams,
): MindMapNode {
  const kind = isMindMapNodeKind(params.kind) ? params.kind : "text";

  return {
    id: createId(),
    title: params.title,
    notes: params.notes ?? "",
    kind,
    data: normalizeMindMapNodeData(kind, params.data),
    color: params.color,
    classicDirection: params.classicDirection,
    x: params.x,
    y: params.y,
    parentId: params.parentId,
    childrenIds: params.childrenIds ?? [],
    collapsed: params.collapsed ?? false,
  };
}

export function createBlankMindMap(title = "Focus Map"): MindMapDocument {
  const rootNode = createMindMapNode({
    title: "Central Topic",
    x: ROOT_X,
    y: ROOT_Y,
    parentId: null,
    color: "slate",
  });

  return {
    id: createId(),
    title,
    rootId: rootNode.id,
    backgroundPresetId: DEFAULT_MINDMAP_BACKGROUND_PRESET_ID,
    layoutType: DEFAULT_MINDMAP_LAYOUT_TYPE,
    nodes: {
      [rootNode.id]: rootNode,
    },
  };
}

export function cloneMindMapDocument(
  document: MindMapDocument,
): MindMapDocument {
  return {
    ...document,
    layoutType: getMindMapLayoutType(document),
    nodes: Object.fromEntries(
      Object.entries(document.nodes).map(([id, node]) => [
        id,
        {
          ...node,
          data: cloneMindMapNodeData(node.kind, node.data),
          childrenIds: [...node.childrenIds],
        },
      ]),
    ),
  };
}

export function getMindMapLayoutType(
  document: MindMapDocument,
): MindMapLayoutType {
  return isMindMapLayoutType(document.layoutType)
    ? document.layoutType
    : DEFAULT_MINDMAP_LAYOUT_TYPE;
}

export function setMindMapLayoutType(
  document: MindMapDocument,
  layoutType: MindMapLayoutType,
): MindMapDocument {
  document.layoutType = layoutType;
  return document;
}

export function getMindMapBackgroundPresetId(
  document: MindMapDocument,
): MindMapBackgroundPresetId {
  return isMindMapBackgroundPresetId(document.backgroundPresetId)
    ? document.backgroundPresetId
    : DEFAULT_MINDMAP_BACKGROUND_PRESET_ID;
}

export function setMindMapBackgroundPresetId(
  document: MindMapDocument,
  backgroundPresetId: MindMapBackgroundPresetId,
): MindMapDocument {
  document.backgroundPresetId = backgroundPresetId;
  return document;
}

export function hydrateMindMapDocument(
  document: MindMapDocument,
): MindMapDocument {
  const layoutType = getMindMapLayoutType(document);
  const backgroundPresetId = getMindMapBackgroundPresetId(document);
  let hasHydratedNodes = false;
  const hydratedNodes = Object.fromEntries(
    Object.entries(document.nodes).map(([nodeId, node]) => {
      const hydratedNode = hydrateMindMapNode(node);
      if (hydratedNode !== node) {
        hasHydratedNodes = true;
      }

      return [nodeId, hydratedNode];
    }),
  ) as Record<string, MindMapNode>;

  if (
    !hasHydratedNodes &&
    document.layoutType === layoutType &&
    document.backgroundPresetId === backgroundPresetId
  ) {
    return document;
  }

  return {
    ...document,
    nodes: hasHydratedNodes ? hydratedNodes : document.nodes,
    backgroundPresetId,
    layoutType,
  };
}

export function getBranchDirection(
  document: MindMapDocument,
  nodeId: string,
): -1 | 1 {
  const node = document.nodes[nodeId];

  if (!node || node.parentId === null) {
    return 1;
  }

  const parent = document.nodes[node.parentId];
  if (!parent) {
    return 1;
  }

  if (parent.parentId === null) {
    return node.x >= parent.x ? 1 : -1;
  }

  return getBranchDirection(document, parent.id);
}

export function getSubtreeIds(
  document: MindMapDocument,
  nodeId: string,
): string[] {
  const result: string[] = [];
  const stack = [nodeId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) {
      continue;
    }

    result.push(currentId);
    const currentNode = document.nodes[currentId];
    if (!currentNode) {
      continue;
    }

    for (let index = currentNode.childrenIds.length - 1; index >= 0; index -= 1) {
      stack.push(currentNode.childrenIds[index]);
    }
  }

  return result;
}

export function getVisibleNodeIds(document: MindMapDocument): string[] {
  const result: string[] = [];
  const stack = [document.rootId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) {
      continue;
    }

    result.push(currentId);
    const currentNode = document.nodes[currentId];
    if (!currentNode || currentNode.collapsed) {
      continue;
    }

    for (let index = currentNode.childrenIds.length - 1; index >= 0; index -= 1) {
      stack.push(currentNode.childrenIds[index]);
    }
  }

  return result;
}

export function createChildNode(
  document: MindMapDocument,
  parentId: string,
  title = "New Idea",
): { document: MindMapDocument; nodeId: string } {
  const parent = document.nodes[parentId];
  if (!parent) {
    return { document, nodeId: document.rootId };
  }

  const siblingCount = parent.childrenIds.length;
  const direction =
    parent.parentId === null
      ? (siblingCount % 2 === 0 ? 1 : -1)
      : getBranchDirection(document, parent.id);
  const positionIndex = parent.parentId === null
    ? Math.floor(siblingCount / 2)
    : siblingCount;
  const verticalOffset =
    parent.parentId === null
      ? (siblingCount % 2 === 0 ? -1 : 1) * positionIndex * VERTICAL_GAP
      : siblingCount * VERTICAL_GAP;

  const newNode = createMindMapNode({
    title,
    classicDirection: parent.parentId === null ? direction : undefined,
    x: parent.x + direction * HORIZONTAL_GAP,
    y:
      parent.parentId === null
        ? parent.y + verticalOffset
        : parent.y + verticalOffset - ((Math.max(siblingCount - 1, 0) * VERTICAL_GAP) / 2),
    parentId: parent.id,
    color: parent.color,
  });

  document.nodes[parent.id] = {
    ...parent,
    childrenIds: [...parent.childrenIds, newNode.id],
    collapsed: false,
  };
  document.nodes[newNode.id] = newNode;

  return { document, nodeId: newNode.id };
}

export function createSiblingNode(
  document: MindMapDocument,
  nodeId: string,
): { document: MindMapDocument; nodeId: string } {
  const node = document.nodes[nodeId];
  if (!node || !node.parentId) {
    return createChildNode(document, document.rootId);
  }

  return createChildNode(document, node.parentId);
}

export function duplicateNodeSubtree(
  document: MindMapDocument,
  nodeId: string,
): { document: MindMapDocument; nodeId: string } {
  const sourceNode = document.nodes[nodeId];
  if (!sourceNode || sourceNode.parentId === null) {
    return { document, nodeId: document.rootId };
  }

  const parent = document.nodes[sourceNode.parentId];
  if (!parent) {
    return { document, nodeId: document.rootId };
  }

  const sourceSubtreeIds = getSubtreeIds(document, nodeId);
  const sourceSubtreeIdSet = new Set(sourceSubtreeIds);
  const duplicatedIds = new Map(
    sourceSubtreeIds.map((sourceId) => [sourceId, createId()]),
  );
  const duplicatedRootId = duplicatedIds.get(nodeId) ?? document.rootId;

  sourceSubtreeIds.forEach((sourceId) => {
    const currentNode = document.nodes[sourceId];
    const nextNodeId = duplicatedIds.get(sourceId);
    if (!currentNode || !nextNodeId) {
      return;
    }

    const nextParentId =
      sourceId === nodeId
        ? sourceNode.parentId
        : (currentNode.parentId ? duplicatedIds.get(currentNode.parentId) : null);

    document.nodes[nextNodeId] = {
      ...currentNode,
      id: nextNodeId,
      parentId: nextParentId ?? sourceNode.parentId,
      childrenIds: currentNode.childrenIds
        .filter((childId) => sourceSubtreeIdSet.has(childId))
        .map((childId) => duplicatedIds.get(childId) ?? childId),
    };
  });

  const sourceIndex = parent.childrenIds.indexOf(nodeId);
  const nextChildrenIds = [...parent.childrenIds];
  const insertIndex =
    sourceIndex === -1 ? nextChildrenIds.length : sourceIndex + 1;
  nextChildrenIds.splice(insertIndex, 0, duplicatedRootId);

  document.nodes[parent.id] = {
    ...parent,
    childrenIds: nextChildrenIds,
    collapsed: false,
  };

  if (isClassicMindMapLayoutType(getMindMapLayoutType(document))) {
    offsetDuplicatedSubtreeForClassicLayout(document, nodeId, duplicatedRootId);
  }

  return {
    document,
    nodeId: duplicatedRootId,
  };
}

export function canReparentNode(
  document: MindMapDocument,
  nodeId: string,
  nextParentId: string,
): boolean {
  const node = document.nodes[nodeId];
  const nextParent = document.nodes[nextParentId];

  if (
    !node ||
    node.parentId === null ||
    !nextParent ||
    node.parentId === nextParentId ||
    nodeId === nextParentId
  ) {
    return false;
  }

  return !new Set(getSubtreeIds(document, nodeId)).has(nextParentId);
}

export function reparentNode(
  document: MindMapDocument,
  nodeId: string,
  nextParentId: string,
  options?: { rootDirection?: -1 | 1 },
): { document: MindMapDocument; nodeId: string; moved: boolean } {
  if (!canReparentNode(document, nodeId, nextParentId)) {
    return { document, nodeId, moved: false };
  }

  const node = document.nodes[nodeId];
  const previousParentId = node.parentId;
  const nextParent = document.nodes[nextParentId];

  if (!previousParentId || !nextParent) {
    return { document, nodeId, moved: false };
  }

  const previousParent = document.nodes[previousParentId];
  if (previousParent) {
    document.nodes[previousParent.id] = {
      ...previousParent,
      childrenIds: previousParent.childrenIds.filter((childId) => childId !== nodeId),
    };
  }

  document.nodes[nextParent.id] = {
    ...nextParent,
    childrenIds: [...nextParent.childrenIds.filter((childId) => childId !== nodeId), nodeId],
    collapsed: false,
  };
  document.nodes[nodeId] = {
    ...node,
    parentId: nextParent.id,
  };

  alignReparentedSubtree(document, nodeId, nextParent.id, options?.rootDirection);

  if (isClassicMindMapLayoutType(getMindMapLayoutType(document))) {
    syncClassicRootBranchDirections(document);
  }

  return {
    document,
    nodeId,
    moved: true,
  };
}

export function updateNodePosition(
  document: MindMapDocument,
  positions: Record<string, { x: number; y: number }>,
): MindMapDocument {
  for (const [nodeId, position] of Object.entries(positions)) {
    const node = document.nodes[nodeId];
    if (!node) {
      continue;
    }

    document.nodes[nodeId] = {
      ...node,
      x: position.x,
      y: position.y,
    };
  }

  if (isClassicMindMapLayoutType(getMindMapLayoutType(document))) {
    syncClassicRootBranchDirections(document);
  }

  return document;
}

export function getClassicRootBranchDirection(
  document: MindMapDocument,
  childId: string,
  index: number,
): -1 | 1 {
  const rootNode = document.nodes[document.rootId];
  const childNode = document.nodes[childId];

  if (!rootNode || !childNode) {
    return index % 2 === 0 ? 1 : -1;
  }

  if (childNode.classicDirection === -1 || childNode.classicDirection === 1) {
    return childNode.classicDirection;
  }

  if (childNode.x < rootNode.x) {
    return -1;
  }

  if (childNode.x > rootNode.x) {
    return 1;
  }

  return index % 2 === 0 ? 1 : -1;
}

export function syncClassicRootBranchDirections(
  document: MindMapDocument,
): MindMapDocument {
  const rootNode = document.nodes[document.rootId];

  if (!rootNode) {
    return document;
  }

  rootNode.childrenIds.forEach((childId, index) => {
    const childNode = document.nodes[childId];
    if (!childNode) {
      return;
    }

    const classicDirection =
      childNode.x < rootNode.x
        ? -1
        : childNode.x > rootNode.x
          ? 1
          : (childNode.classicDirection ?? (index % 2 === 0 ? 1 : -1));

    if (childNode.classicDirection === classicDirection) {
      return;
    }

    document.nodes[childId] = {
      ...childNode,
      classicDirection,
    };
  });

  return document;
}

export function deleteNode(
  document: MindMapDocument,
  nodeId: string,
): { document: MindMapDocument; selectedNodeId: string } {
  const node = document.nodes[nodeId];
  if (!node || node.parentId === null) {
    return { document, selectedNodeId: document.rootId };
  }

  const parent = document.nodes[node.parentId];
  if (parent) {
    document.nodes[parent.id] = {
      ...parent,
      childrenIds: parent.childrenIds.filter((childId) => childId !== nodeId),
    };
  }

  for (const currentId of getSubtreeIds(document, nodeId)) {
    delete document.nodes[currentId];
  }

  return {
    document,
    selectedNodeId: node.parentId,
  };
}

export function expandAllNodes(document: MindMapDocument): MindMapDocument {
  for (const nodeId of Object.keys(document.nodes)) {
    const node = document.nodes[nodeId];
    document.nodes[nodeId] = {
      ...node,
      collapsed: false,
    };
  }

  return document;
}

export function resolveSelectedNodeId(
  document: MindMapDocument,
  preferredNodeId: string | null | undefined,
): string {
  if (preferredNodeId && document.nodes[preferredNodeId]) {
    return preferredNodeId;
  }

  return document.rootId;
}

export function loadStoredMindMap(): MindMapDocument | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as MindMapDocument;
    if (isMindMapDocument(parsed)) {
      return hydrateMindMapDocument(parsed);
    }
  } catch {
    return null;
  }

  return null;
}

export function saveMindMap(document: MindMapDocument): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(hydrateMindMapDocument(document)),
  );
}

export function loadStoredTemplateId(): string | null {
  return localStorage.getItem(TEMPLATE_KEY);
}

export function saveTemplateId(templateId: string): void {
  localStorage.setItem(TEMPLATE_KEY, templateId);
}

export function isMindMapDocument(value: unknown): value is MindMapDocument {
  if (!value || typeof value !== "object") {
    return false;
  }

  const document = value as Partial<MindMapDocument>;
  if (
    typeof document.id !== "string" ||
    typeof document.title !== "string" ||
    typeof document.rootId !== "string" ||
    !document.nodes ||
    typeof document.nodes !== "object"
  ) {
    return false;
  }

  const rootNode = document.nodes[document.rootId];
  if (!isMindMapNode(rootNode)) {
    return false;
  }

  return Object.values(document.nodes).every(isMindMapNode);
}

function isMindMapLayoutType(value: unknown): value is MindMapLayoutType {
  return (
    typeof value === "string" &&
    MINDMAP_LAYOUT_TYPES.includes(value as MindMapLayoutType)
  );
}

function isMindMapNodeKind(value: unknown): value is MindMapNodeKind {
  return (
    typeof value === "string" &&
    MINDMAP_NODE_KINDS.includes(value as MindMapNodeKind)
  );
}

function isMindMapNode(value: unknown): value is MindMapNode {
  if (!value || typeof value !== "object") {
    return false;
  }

  const node = value as Partial<MindMapNode>;
  const kind = isMindMapNodeKind(node.kind) ? node.kind : "text";

  return (
    typeof node.id === "string" &&
    typeof node.title === "string" &&
    typeof node.notes === "string" &&
    (node.kind === undefined || isMindMapNodeKind(node.kind)) &&
    isMindMapNodeDataValue(kind, node.data) &&
    typeof node.color === "string" &&
    (node.classicDirection === undefined ||
      node.classicDirection === -1 ||
      node.classicDirection === 1) &&
    typeof node.x === "number" &&
    typeof node.y === "number" &&
    (typeof node.parentId === "string" || node.parentId === null) &&
    Array.isArray(node.childrenIds) &&
    node.childrenIds.every((childId) => typeof childId === "string") &&
    typeof node.collapsed === "boolean"
  );
}

function cloneMindMapNodeData(
  kind: MindMapNodeKind,
  data: MindMapNodeData,
): MindMapNodeData {
  switch (kind) {
    case "image":
      return { imageUrl: normalizeMindMapNodeData("image", data).imageUrl };
    case "link":
      return { url: normalizeMindMapNodeData("link", data).url };
    case "emoji":
      return { emoji: normalizeMindMapNodeData("emoji", data).emoji };
    case "text":
    default:
      return {};
  }
}

function convertMindMapNodeData(
  node: MindMapNode,
  kind: MindMapNodeKind,
): MindMapNodeData {
  if (kind === "image") {
    return {
      imageUrl:
        node.kind === "image"
          ? normalizeMindMapNodeData("image", node.data).imageUrl
          : "",
    };
  }

  if (kind === "link") {
    return node.kind === "link"
      ? { url: normalizeMindMapNodeData("link", node.data).url }
      : { url: "" };
  }

  if (kind === "emoji") {
    return node.kind === "emoji"
      ? { emoji: normalizeMindMapNodeData("emoji", node.data).emoji }
      : { emoji: "" };
  }

  return {};
}

function normalizeMindMapNodeData(
  kind: "text",
  data: unknown,
): MindMapNodeDataByKind["text"];
function normalizeMindMapNodeData(
  kind: "image",
  data: unknown,
): MindMapNodeDataByKind["image"];
function normalizeMindMapNodeData(
  kind: "link",
  data: unknown,
): MindMapNodeDataByKind["link"];
function normalizeMindMapNodeData(
  kind: "emoji",
  data: unknown,
): MindMapNodeDataByKind["emoji"];
function normalizeMindMapNodeData(
  kind: MindMapNodeKind,
  data: unknown,
): MindMapNodeData;
function normalizeMindMapNodeData(
  kind: MindMapNodeKind,
  data: unknown,
): MindMapNodeData {
  if (!isRecord(data)) {
    return createDefaultMindMapNodeData(kind);
  }

  switch (kind) {
    case "image":
      return {
        imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
      };
    case "link":
      return {
        url: typeof data.url === "string" ? data.url : "",
      };
    case "emoji":
      return {
        emoji: typeof data.emoji === "string" ? data.emoji : "",
      };
    case "text":
    default:
      return {};
  }
}

function isMindMapNodeDataValue(
  kind: MindMapNodeKind,
  value: unknown,
): boolean {
  if (value === undefined) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  switch (kind) {
    case "image":
      return value.imageUrl === undefined || typeof value.imageUrl === "string";
    case "link":
      return value.url === undefined || typeof value.url === "string";
    case "emoji":
      return value.emoji === undefined || typeof value.emoji === "string";
    case "text":
    default:
      return true;
  }
}

function isMindMapNodeDataEquivalent(
  kind: MindMapNodeKind,
  value: unknown,
  normalizedValue: MindMapNodeData,
): boolean {
  if (!isRecord(value)) {
    return false;
  }

  switch (kind) {
    case "image":
      return (
        normalizeMindMapNodeData("image", value).imageUrl ===
        normalizeMindMapNodeData("image", normalizedValue).imageUrl
      );
    case "link":
      return value.url === normalizeMindMapNodeData("link", normalizedValue).url;
    case "emoji":
      return value.emoji === normalizeMindMapNodeData("emoji", normalizedValue).emoji;
    case "text":
    default:
      return Object.keys(value).length === 0;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export const MIND_MAP_TEMPLATES: MindMapTemplate[] = [
  {
    id: "blank",
    name: "Blank Canvas",
    description: "Start from a single central topic and build your own branches.",
    create: () => createBlankMindMap("Focus Map"),
  },
  {
    id: "weekly-review",
    name: "Weekly Review",
    description: "Capture wins, blockers, priorities and follow-ups in one place.",
    create: () => {
      const document = createBlankMindMap("Weekly Review");
      const rootNode = document.nodes[document.rootId];
      rootNode.title = "Week 14 Review";

      const branches = [
        "Highlights",
        "Blockers",
        "Key Decisions",
        "Next Week",
      ];

      branches.forEach((branchTitle) => {
        const result = createChildNode(document, document.rootId, branchTitle);
        createChildNode(document, result.nodeId, "Detail");
      });

      return document;
    },
  },
  {
    id: "learning-plan",
    name: "Learning Plan",
    description: "Break a topic into concepts, practice, resources and checkpoints.",
    create: () => {
      const document = createBlankMindMap("Learning Sprint");
      const rootNode = document.nodes[document.rootId];
      rootNode.title = "New Skill";

      const concepts = createChildNode(document, document.rootId, "Core Concepts");
      createChildNode(document, concepts.nodeId, "Fundamentals");
      createChildNode(document, concepts.nodeId, "Mental Models");

      const practice = createChildNode(document, document.rootId, "Practice");
      createChildNode(document, practice.nodeId, "Exercises");
      createChildNode(document, practice.nodeId, "Mini Project");

      const resources = createChildNode(document, document.rootId, "Resources");
      createChildNode(document, resources.nodeId, "Articles");
      createChildNode(document, resources.nodeId, "Videos");

      const checkpoints = createChildNode(document, document.rootId, "Checkpoints");
      createChildNode(document, checkpoints.nodeId, "Week 1");
      createChildNode(document, checkpoints.nodeId, "Week 2");

      return document;
    },
  },
];

function createId(): string {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `node-${Math.random().toString(36).slice(2, 10)}`;
}

function offsetDuplicatedSubtreeForClassicLayout(
  document: MindMapDocument,
  sourceNodeId: string,
  duplicatedNodeId: string,
): void {
  const sourceNode = document.nodes[sourceNodeId];
  const duplicatedNode = document.nodes[duplicatedNodeId];
  if (!sourceNode || !duplicatedNode || !sourceNode.parentId) {
    return;
  }

  const parent = document.nodes[sourceNode.parentId];
  if (!parent) {
    return;
  }

  const duplicatedBounds = getSubtreeVerticalBounds(document, duplicatedNodeId);
  if (!duplicatedBounds) {
    return;
  }

  const siblingBottom = parent.childrenIds
    .filter((siblingId) => siblingId !== duplicatedNodeId)
    .filter((siblingId) =>
      shouldCompareSiblingBranch(document, sourceNodeId, parent.id, siblingId),
    )
    .reduce((maxBottom, siblingId) => {
      const siblingBounds = getSubtreeVerticalBounds(document, siblingId);
      return siblingBounds ? Math.max(maxBottom, siblingBounds.maxY) : maxBottom;
    }, Number.NEGATIVE_INFINITY);

  if (!Number.isFinite(siblingBottom)) {
    return;
  }

  const deltaY = siblingBottom + VERTICAL_GAP - duplicatedBounds.minY;
  if (deltaY <= 0) {
    return;
  }

  getSubtreeIds(document, duplicatedNodeId).forEach((currentId) => {
    const currentNode = document.nodes[currentId];
    if (!currentNode) {
      return;
    }

    document.nodes[currentId] = {
      ...currentNode,
      y: currentNode.y + deltaY,
    };
  });
}

function shouldCompareSiblingBranch(
  document: MindMapDocument,
  referenceNodeId: string,
  parentId: string,
  siblingId: string,
): boolean {
  const parent = document.nodes[parentId];
  if (!parent) {
    return false;
  }

  if (parent.parentId !== null) {
    return true;
  }

  return getBranchDirection(document, referenceNodeId) === getBranchDirection(document, siblingId);
}

function getSubtreeVerticalBounds(
  document: MindMapDocument,
  nodeId: string,
): { minY: number; maxY: number } | null {
  const layoutType = getMindMapLayoutType(document);
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  getSubtreeIds(document, nodeId).forEach((currentId) => {
    const currentNode = document.nodes[currentId];
    if (!currentNode) {
      return;
    }

    const nodeHeight = getNodeHeightForLayout(layoutType, currentNode);
    minY = Math.min(minY, currentNode.y);
    maxY = Math.max(maxY, currentNode.y + nodeHeight);
  });

  if (!Number.isFinite(minY) || !Number.isFinite(maxY)) {
    return null;
  }

  return { minY, maxY };
}

function alignReparentedSubtree(
  document: MindMapDocument,
  nodeId: string,
  parentId: string,
  rootDirection?: -1 | 1,
): void {
  const node = document.nodes[nodeId];
  const parent = document.nodes[parentId];

  if (!node || !parent) {
    return;
  }

  const direction =
    parent.parentId === null
      ? (rootDirection ?? (node.x < parent.x ? -1 : 1))
      : getBranchDirection(document, parent.id);
  const desiredX = parent.x + direction * HORIZONTAL_GAP;

  if (
    (direction === 1 && node.x >= desiredX) ||
    (direction === -1 && node.x <= desiredX)
  ) {
    return;
  }

  const deltaX = desiredX - node.x;
  for (const currentId of getSubtreeIds(document, nodeId)) {
    const currentNode = document.nodes[currentId];
    if (!currentNode) {
      continue;
    }

    document.nodes[currentId] = {
      ...currentNode,
      x: currentNode.x + deltaX,
    };
  }
}
