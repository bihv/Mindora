import {
  AUTO_LAYOUT_HORIZONTAL_GAP,
  AUTO_LAYOUT_VERTICAL_GAP,
} from "../constants";
import { getNodeHeightForLayout } from "../../../domain/mindmap/layout";
import { getClassicRootBranchDirection } from "../../../domain/mindmap/classicBranchSync";
import type {
  MindMapDocument,
  MindMapLayoutType,
} from "../../../domain/mindmap/model";
import type { Position } from "../types";
import { stackAutoLayoutSiblings } from "./treeLayoutMath";
import { buildDirectedTreeLayout } from "./treeAutoLayout";
import type { AutoLayoutResult, TreeLayoutConfig } from "./types";

export function buildMindMapLayoutPositions(
  document: MindMapDocument,
  layoutType: MindMapLayoutType,
): Record<string, Position> {
  const config: TreeLayoutConfig = {
    horizontalGap: AUTO_LAYOUT_HORIZONTAL_GAP,
    verticalGap: AUTO_LAYOUT_VERTICAL_GAP,
    layoutType,
  };
  const positions = Object.fromEntries(
    Object.values(document.nodes).map((node) => [node.id, { x: node.x, y: node.y }]),
  ) as Record<string, Position>;
  const rootNode = document.nodes[document.rootId];

  if (!rootNode) {
    return positions;
  }

  positions[rootNode.id] = { x: rootNode.x, y: rootNode.y };
  const rootCenterY = rootNode.y + getNodeHeightForLayout(layoutType, rootNode) / 2;
  const leftChildren: string[] = [];
  const rightChildren: string[] = [];

  rootNode.childrenIds.forEach((childId, index) => {
    const childNode = document.nodes[childId];
    if (!childNode) {
      return;
    }

    const direction = getClassicRootBranchDirection(document, childId, index);

    if (direction === -1) {
      leftChildren.push(childId);
      return;
    }

    rightChildren.push(childId);
  });

  const layoutRootSide = (childIds: string[], direction: -1 | 1) => {
    const layouts = childIds
      .map((childId) => {
        const node = document.nodes[childId];
        if (!node) {
          return null;
        }

        return buildDirectedTreeLayout(document, childId, direction, config);
      })
      .filter((layout): layout is AutoLayoutResult => layout !== null);

    const offsets = stackAutoLayoutSiblings(layouts, 1, config.verticalGap);

    layouts.forEach((layout, index) => {
      const offsetY = offsets[index] ?? 0;

      Object.entries(layout.positions).forEach(([nodeId, position]) => {
        const currentNode = document.nodes[nodeId];
        const nodeHeight = getNodeHeightForLayout(layoutType, currentNode);
        positions[nodeId] = {
          x: rootNode.x + direction * config.horizontalGap + position.x,
          y: rootCenterY + offsetY + position.y - nodeHeight / 2,
        };
      });
    });
  };

  layoutRootSide(leftChildren, -1);
  layoutRootSide(rightChildren, 1);

  return positions;
}
