import {
  CONNECTOR_CURVE_OFFSET,
  MINIMAP_HEIGHT,
  MINIMAP_PADDING,
  MINIMAP_WIDTH,
  MINIMAP_WORLD_PADDING,
  NODE_WIDTH,
} from "./constants";
import {
  createLayoutConnectorPath,
  getConnectorFocusState,
} from "./layout";
import type {
  CameraState,
  ConnectorItem,
  ConnectorPreviewItem,
  DraggingState,
  MinimapData,
  NodeFocusState,
  NodeReparentingState,
  Position,
  SearchMatch,
} from "./types";
import {
  NODE_COLORS,
  getMindMapLayoutType,
  getBranchDirection,
  getNodeHeightForLayout,
  getNodeSizeForLayout,
  getMindMapNodeSearchTexts,
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
    return getMindMapNodeSearchTexts(node).some((value) =>
      value.toLowerCase().includes(normalizedQuery),
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

    const selfMatches = getMindMapNodeSearchTexts(node).some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    );
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
  viewportScale: number,
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
      const parentSize = getNodeSizeForLayout(layoutType, parent);
      const childSize = getNodeSizeForLayout(layoutType, node);
      const scaledParentSize = {
        width: parentSize.width * viewportScale,
        height: parentSize.height * viewportScale,
      };
      const scaledChildSize = {
        width: childSize.width * viewportScale,
        height: childSize.height * viewportScale,
      };
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
          CONNECTOR_CURVE_OFFSET * viewportScale,
          scaledParentSize,
          scaledChildSize,
        ),
      };
    })
    .filter((item): item is ConnectorItem => item !== null);
}

export function buildReparentPreviewConnector(
  document: MindMapDocument,
  layoutType: MindMapLayoutType,
  stagePositions: Record<string, Position>,
  viewportScale: number,
  reparenting: NodeReparentingState | null,
): ConnectorPreviewItem | null {
  if (!reparenting) {
    return null;
  }

  const node = document.nodes[reparenting.nodeId];
  const childPosition = stagePositions[reparenting.nodeId];

  if (!node || !childPosition) {
    return null;
  }

  if (reparenting.candidateParentId) {
    const parent = document.nodes[reparenting.candidateParentId];
    const parentPosition = stagePositions[reparenting.candidateParentId];

    if (!parent || !parentPosition) {
      return null;
    }

    const direction =
      parent.parentId === null
        ? (reparenting.rootDirection ?? 1)
        : getBranchDirection(document, parent.id);
    const parentSize = getNodeSizeForLayout(layoutType, parent);
    const childSize = getNodeSizeForLayout(layoutType, node);

    return {
      color: NODE_COLORS[node.color].accent,
      isSnapped: true,
      path: createLayoutConnectorPath(
        layoutType,
        parentPosition,
        childPosition,
        direction,
        CONNECTOR_CURVE_OFFSET * viewportScale,
        {
          width: parentSize.width * viewportScale,
          height: parentSize.height * viewportScale,
        },
        {
          width: childSize.width * viewportScale,
          height: childSize.height * viewportScale,
        },
      ),
    };
  }

  return {
    color: NODE_COLORS[node.color].accent,
    isSnapped: false,
    path: createLayoutConnectorPath(
      layoutType,
      reparenting.pointerPosition,
      childPosition,
      reparenting.pointerPosition.x <= childPosition.x ? 1 : -1,
      CONNECTOR_CURVE_OFFSET * viewportScale,
      {
        width: 0,
        height: 0,
      },
      {
        width: getNodeSizeForLayout(layoutType, node).width * viewportScale,
        height: getNodeSizeForLayout(layoutType, node).height * viewportScale,
      },
    ),
  };
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
  const visibleWorldWidth = canvasWidth / camera.scale;
  const visibleWorldHeight = canvasHeight / camera.scale;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const nodeId of visibleNodeIds) {
    const node = document.nodes[nodeId];
    const position = renderPositions[nodeId];
    if (!node || !position) {
      continue;
    }

    const nodeHeight = getNodeHeightForLayout(layoutType, node);
    minX = Math.min(minX, position.x);
    minY = Math.min(minY, position.y);
    maxX = Math.max(maxX, position.x + NODE_WIDTH);
    maxY = Math.max(maxY, position.y + nodeHeight);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    minX = camera.x;
    minY = camera.y;
    maxX = camera.x + visibleWorldWidth;
    maxY = camera.y + visibleWorldHeight;
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

  const nodes = visibleNodeIds.map((nodeId) => {
    const node = document.nodes[nodeId];
    const position = renderPositions[nodeId];
    const nodeHeight = getNodeHeightForLayout(layoutType, node);

    return {
      id: nodeId,
      color: NODE_COLORS[node.color].accent,
      focusState: nodeFocusStates[nodeId] ?? "dimmed",
      isSelected: hasActiveSelection && nodeId === selectedNodeId,
      x: offsetX + (position.x - minX) * scale,
      y: offsetY + (position.y - minY) * scale,
      width: Math.max(NODE_WIDTH * scale, 8),
      height: Math.max(nodeHeight * scale, 6),
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

      const parentNode = document.nodes[node.parentId];
      if (!parentNode) {
        return null;
      }

      const direction = getBranchDirection(document, nodeId);
      const scaledParentSize = {
        width: Math.max(NODE_WIDTH * scale, 8),
        height: Math.max(
          getNodeHeightForLayout(layoutType, parentNode) * scale,
          6,
        ),
      };
      const scaledChildSize = {
        width: Math.max(NODE_WIDTH * scale, 8),
        height: Math.max(getNodeHeightForLayout(layoutType, node) * scale, 6),
      };
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
          scaledParentSize,
          scaledChildSize,
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
      width: visibleWorldWidth * scale,
      height: visibleWorldHeight * scale,
    },
  };
}
