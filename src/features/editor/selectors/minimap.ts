import {
  MINIMAP_HEIGHT,
  MINIMAP_PADDING,
  MINIMAP_WIDTH,
  MINIMAP_WORLD_PADDING,
  CONNECTOR_CURVE_OFFSET,
} from "../constants";
import {
  createLayoutConnectorPath,
  getConnectorFocusState,
} from "../layout";
import type {
  CameraState,
  MinimapData,
  NodeFocusState,
  Position,
} from "../types";
import {
  NODE_COLORS,
  type MindMapDocument,
} from "../../../domain/mindmap/model";
import { getNodeHeightForLayout } from "../../../domain/mindmap/layout";
import { getMindMapLayoutType } from "../../../domain/mindmap/documents";
import { getBranchDirection } from "../../../domain/mindmap/treeQueries";
import { buildScaledNodeWidth } from "./connectors";

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
    maxX = Math.max(maxX, position.x + buildScaledNodeWidth(1));
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
      width: buildScaledNodeWidth(scale),
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
        width: buildScaledNodeWidth(scale),
        height: Math.max(
          getNodeHeightForLayout(layoutType, parentNode) * scale,
          6,
        ),
      };
      const scaledChildSize = {
        width: buildScaledNodeWidth(scale),
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
