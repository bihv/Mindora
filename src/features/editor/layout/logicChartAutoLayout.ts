import { getNodeHeightForLayout } from "../../../domain/mindmap/layout";
import type {
  MindMapDocument,
  MindMapLayoutType,
} from "../../../domain/mindmap/model";
import type { Position } from "../types";
import { stackAutoLayoutSiblings } from "./treeLayoutMath";
import { buildDirectedTreeLayout } from "./treeAutoLayout";
import type { AutoLayoutResult, TreeLayoutConfig } from "./types";

export function buildLogicChartLayoutPositions(
  document: MindMapDocument,
  layoutType: MindMapLayoutType,
): Record<string, Position> {
  const config: TreeLayoutConfig = {
    horizontalGap: 320,
    verticalGap: 10,
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
  const layouts = rootNode.childrenIds
    .map((childId) => {
      if (!document.nodes[childId]) {
        return null;
      }

      return buildDirectedTreeLayout(document, childId, 1, config);
    })
    .filter((layout): layout is AutoLayoutResult => layout !== null);
  const offsets = stackAutoLayoutSiblings(layouts, 1, config.verticalGap);

  layouts.forEach((layout, index) => {
    const offsetY = offsets[index] ?? 0;

    Object.entries(layout.positions).forEach(([nodeId, position]) => {
      const currentNode = document.nodes[nodeId];
      const nodeHeight = getNodeHeightForLayout(layoutType, currentNode);
      positions[nodeId] = {
        x: rootNode.x + config.horizontalGap + position.x,
        y: rootCenterY + offsetY + position.y - nodeHeight / 2,
      };
    });
  });

  return positions;
}
