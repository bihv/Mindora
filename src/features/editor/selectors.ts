import {
  CONNECTOR_CURVE_OFFSET,
  MINIMAP_HEIGHT,
  MINIMAP_PADDING,
  MINIMAP_WIDTH,
  MINIMAP_WORLD_PADDING,
  NODE_HEIGHT,
  NODE_WIDTH,
} from "./constants";
import {
  createLayoutConnectorPath,
  getConnectorFocusState,
} from "./layout";
import type {
  CameraState,
  ConnectorItem,
  DraggingState,
  MinimapData,
  NodeFocusState,
  Position,
  SearchMatch,
} from "./types";
import {
  NODE_COLORS,
  getMindMapLayoutType,
  getBranchDirection,
  getSubtreeIds,
  type MindMapDocument,
  type MindMapLayoutType,
} from "../../mindmap";

export function buildRenderPositions(
  document: MindMapDocument,
  dragging: DraggingState | null,
): Record<string, Position> {
  const positions = Object.fromEntries(
    Object.values(document.nodes).map((node) => [node.id, { x: node.x, y: node.y }]),
  ) as Record<string, Position>;

  if (!dragging) {
    return positions;
  }

  for (const nodeId of dragging.subtreeIds) {
    const origin = dragging.originPositions[nodeId];
    if (!origin) {
      continue;
    }

    positions[nodeId] = {
      x: origin.x + dragging.delta.x,
      y: origin.y + dragging.delta.y,
    };
  }

  return positions;
}

export function buildSelectedLineageSet(
  document: MindMapDocument,
  selectedNodeId: string,
  hasActiveSelection: boolean,
): Set<string> {
  const lineage = new Set<string>();
  if (!hasActiveSelection) {
    return lineage;
  }

  let currentNode: MindMapDocument["nodes"][string] | undefined =
    document.nodes[selectedNodeId];

  while (currentNode) {
    lineage.add(currentNode.id);
    currentNode = currentNode.parentId
      ? document.nodes[currentNode.parentId]
      : undefined;
  }

  return lineage;
}

export function buildSelectedDescendantSet(
  document: MindMapDocument,
  selectedNodeId: string,
  hasActiveSelection: boolean,
): Set<string> {
  if (!hasActiveSelection) {
    return new Set<string>();
  }

  const descendants = new Set(getSubtreeIds(document, selectedNodeId));
  descendants.delete(selectedNodeId);
  return descendants;
}

export function buildNodeFocusStates(
  visibleNodeIds: string[],
  hasActiveSelection: boolean,
  selectedNodeId: string,
  selectedLineageSet: Set<string>,
  selectedDescendantSet: Set<string>,
): Record<string, NodeFocusState> {
  return Object.fromEntries(
    visibleNodeIds.map((nodeId) => {
      let focusState: NodeFocusState;

      if (!hasActiveSelection) {
        focusState = "lineage";
      } else if (nodeId === selectedNodeId) {
        focusState = "selected";
      } else if (selectedLineageSet.has(nodeId)) {
        focusState = "lineage";
      } else if (selectedDescendantSet.has(nodeId)) {
        focusState = "descendant";
      } else {
        focusState = "dimmed";
      }

      return [nodeId, focusState];
    }),
  ) as Record<string, NodeFocusState>;
}

export function findSearchMatches(
  document: MindMapDocument,
  query: string,
): SearchMatch[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return Object.values(document.nodes).filter((node) => {
    return (
      node.title.toLowerCase().includes(normalizedQuery) ||
      node.notes.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function buildOutlineSearchVisibleSet(
  document: MindMapDocument,
  query: string,
): Set<string> | null {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return null;
  }

  const cache = new Map<string, boolean>();

  const subtreeHasMatch = (nodeId: string): boolean => {
    const cached = cache.get(nodeId);
    if (cached !== undefined) {
      return cached;
    }

    const node = document.nodes[nodeId];
    if (!node) {
      cache.set(nodeId, false);
      return false;
    }

    const selfMatches =
      node.title.toLowerCase().includes(normalizedQuery) ||
      node.notes.toLowerCase().includes(normalizedQuery);
    if (selfMatches) {
      cache.set(nodeId, true);
      return true;
    }

    let anyChild = false;
    for (const childId of node.childrenIds) {
      if (subtreeHasMatch(childId)) {
        anyChild = true;
      }
    }

    cache.set(nodeId, anyChild);
    return anyChild;
  };

  subtreeHasMatch(document.rootId);

  const visible = new Set<string>();
  for (const [id, ok] of cache) {
    if (ok) {
      visible.add(id);
    }
  }

  return visible;
}

export function buildConnectors(
  document: MindMapDocument,
  layoutType: MindMapLayoutType,
  visibleNodeIds: string[],
  visibleNodeIdSet: Set<string>,
  stagePositions: Record<string, Position>,
  nodeFocusStates: Record<string, NodeFocusState>,
): ConnectorItem[] {
  return visibleNodeIds
    .filter((nodeId) => nodeId !== document.rootId)
    .map((nodeId) => {
      const node = document.nodes[nodeId];
      if (!node?.parentId || !visibleNodeIdSet.has(node.parentId)) {
        return null;
      }

      const parent = document.nodes[node.parentId];
      if (!parent) {
        return null;
      }

      const parentPosition = stagePositions[parent.id];
      const childPosition = stagePositions[node.id];
      const direction = getBranchDirection(document, node.id);
      const focusState = getConnectorFocusState(
        nodeFocusStates[parent.id] ?? "dimmed",
        nodeFocusStates[node.id] ?? "dimmed",
      );

      return {
        id: node.id,
        color: NODE_COLORS[node.color].accent,
        focusState,
        path: createLayoutConnectorPath(
          layoutType,
          parentPosition,
          childPosition,
          direction,
          CONNECTOR_CURVE_OFFSET,
        ),
      };
    })
    .filter((item): item is ConnectorItem => item !== null);
}

type BuildMinimapDataParams = {
  camera: CameraState;
  canvasHeight: number;
  canvasWidth: number;
  document: MindMapDocument;
  hasActiveSelection: boolean;
  nodeFocusStates: Record<string, NodeFocusState>;
  renderPositions: Record<string, Position>;
  selectedNodeId: string;
  visibleNodeIdSet: Set<string>;
  visibleNodeIds: string[];
};

export function buildMinimapData({
  camera,
  canvasHeight,
  canvasWidth,
  document,
  hasActiveSelection,
  nodeFocusStates,
  renderPositions,
  selectedNodeId,
  visibleNodeIdSet,
  visibleNodeIds,
}: BuildMinimapDataParams): MinimapData {
  const layoutType = getMindMapLayoutType(document);
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const nodeId of visibleNodeIds) {
    const position = renderPositions[nodeId];
    if (!position) {
      continue;
    }

    minX = Math.min(minX, position.x);
    minY = Math.min(minY, position.y);
    maxX = Math.max(maxX, position.x + NODE_WIDTH);
    maxY = Math.max(maxY, position.y + NODE_HEIGHT);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    minX = camera.x;
    minY = camera.y;
    maxX = camera.x + canvasWidth;
    maxY = camera.y + canvasHeight;
  }

  minX -= MINIMAP_WORLD_PADDING;
  minY -= MINIMAP_WORLD_PADDING;
  maxX += MINIMAP_WORLD_PADDING;
  maxY += MINIMAP_WORLD_PADDING;

  const worldWidth = Math.max(maxX - minX, 1);
  const worldHeight = Math.max(maxY - minY, 1);
  const drawableWidth = MINIMAP_WIDTH - MINIMAP_PADDING * 2;
  const drawableHeight = MINIMAP_HEIGHT - MINIMAP_PADDING * 2;
  const scale = Math.min(drawableWidth / worldWidth, drawableHeight / worldHeight);
  const contentWidth = worldWidth * scale;
  const contentHeight = worldHeight * scale;
  const offsetX = (MINIMAP_WIDTH - contentWidth) / 2;
  const offsetY = (MINIMAP_HEIGHT - contentHeight) / 2;
  const minimapNodeWidth = Math.max(NODE_WIDTH * scale, 8);
  const minimapNodeHeight = Math.max(NODE_HEIGHT * scale, 6);
  const minimapNodeSize = {
    width: minimapNodeWidth,
    height: minimapNodeHeight,
  };

  const nodes = visibleNodeIds.map((nodeId) => {
    const node = document.nodes[nodeId];
    const position = renderPositions[nodeId];

    return {
      id: nodeId,
      color: NODE_COLORS[node.color].accent,
      focusState: nodeFocusStates[nodeId] ?? "dimmed",
      isSelected: hasActiveSelection && nodeId === selectedNodeId,
      x: offsetX + (position.x - minX) * scale,
      y: offsetY + (position.y - minY) * scale,
      width: minimapNodeWidth,
      height: minimapNodeHeight,
    };
  });

  const connectorPaths = visibleNodeIds
    .filter((nodeId) => nodeId !== document.rootId)
    .map((nodeId) => {
      const node = document.nodes[nodeId];
      if (!node?.parentId || !visibleNodeIdSet.has(node.parentId)) {
        return null;
      }

      const parentPosition = renderPositions[node.parentId];
      const childPosition = renderPositions[nodeId];
      if (!parentPosition || !childPosition) {
        return null;
      }

      const direction = getBranchDirection(document, nodeId);
      const scaledParentPosition = {
        x: offsetX + (parentPosition.x - minX) * scale,
        y: offsetY + (parentPosition.y - minY) * scale,
      };
      const scaledChildPosition = {
        x: offsetX + (childPosition.x - minX) * scale,
        y: offsetY + (childPosition.y - minY) * scale,
      };

      const focusState = getConnectorFocusState(
        nodeFocusStates[node.parentId] ?? "dimmed",
        nodeFocusStates[nodeId] ?? "dimmed",
      );

      return {
        id: nodeId,
        focusState,
        path: createLayoutConnectorPath(
          layoutType,
          scaledParentPosition,
          scaledChildPosition,
          direction,
          CONNECTOR_CURVE_OFFSET * scale,
          minimapNodeSize,
          minimapNodeSize,
        ),
      };
    })
    .filter(
      (
        item,
      ): item is {
        id: string;
        focusState: "lineage" | "descendant" | "dimmed";
        path: string;
      } => item !== null,
    );

  return {
    bounds: { minX, minY },
    contentHeight,
    contentWidth,
    connectorPaths,
    nodes,
    offsetX,
    offsetY,
    scale,
    viewport: {
      x: offsetX + (camera.x - minX) * scale,
      y: offsetY + (camera.y - minY) * scale,
      width: canvasWidth * scale,
      height: canvasHeight * scale,
    },
  };
}
