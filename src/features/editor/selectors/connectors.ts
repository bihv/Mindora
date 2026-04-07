import {
  CONNECTOR_CURVE_OFFSET,
  NODE_WIDTH,
} from "../constants";
import {
  createLayoutConnectorPath,
  getConnectorFocusState,
} from "../layout";
import type {
  ConnectorItem,
  ConnectorPreviewItem,
  NodeFocusState,
  NodeReparentingState,
  Position,
} from "../types";
import {
  NODE_COLORS,
  type MindMapDocument,
  type MindMapLayoutType,
} from "../../../domain/mindmap/model";
import { getNodeSizeForLayout } from "../../../domain/mindmap/layout";
import { getBranchDirection } from "../../../domain/mindmap/treeQueries";

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

export function buildScaledNodeWidth(scale: number): number {
  return Math.max(NODE_WIDTH * scale, 8);
}
