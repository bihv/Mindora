import {
  DEFAULT_MINDMAP_BACKGROUND_PRESET_ID,
  isMindMapBackgroundPresetId,
  type MindMapBackgroundPresetId,
} from "./backgroundPresets/presetCatalog";
import {
  DEFAULT_MINDMAP_LAYOUT_TYPE,
  isMindMapLayoutType,
  isMindMapNodeKind,
  type MindMapDocument,
  type MindMapLayoutType,
  type MindMapNode,
} from "./model";
import { ROOT_X, ROOT_Y } from "./layoutMetrics";
import {
  cloneMindMapNodeData,
  hydrateMindMapNode,
  isMindMapNodeDataValue,
  normalizeMindMapNodeData,
} from "./nodeContent";

type CreateMindMapNodeParams = Pick<
  MindMapNode,
  "title" | "x" | "y" | "parentId" | "color"
> &
  Partial<
    Omit<MindMapNode, "id" | "title" | "x" | "y" | "parentId" | "color">
  >;

export function createMindMapId(): string {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `node-${Math.random().toString(36).slice(2, 10)}`;
}

export function createMindMapNode(
  params: CreateMindMapNodeParams,
): MindMapNode {
  const kind = isMindMapNodeKind(params.kind) ? params.kind : "text";

  return {
    id: createMindMapId(),
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
    id: createMindMapId(),
    title,
    rootId: rootNode.id,
    backgroundPresetId: DEFAULT_MINDMAP_BACKGROUND_PRESET_ID,
    layoutType: DEFAULT_MINDMAP_LAYOUT_TYPE,
    nodes: {
      [rootNode.id]: rootNode,
    },
  };
}

export function cloneMindMapDocument(document: MindMapDocument): MindMapDocument {
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

export function hydrateMindMapDocument(document: MindMapDocument): MindMapDocument {
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
