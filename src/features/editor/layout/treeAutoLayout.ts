import { getNodeHeightForLayout } from "../../../domain/mindmap/layout";
import type { MindMapDocument } from "../../../domain/mindmap/model";
import { mergeAutoLayoutContours, stackAutoLayoutSiblings } from "./treeLayoutMath";
import type { AutoLayoutResult, TreeLayoutConfig } from "./types";

export function buildDirectedTreeLayout(
  document: MindMapDocument,
  nodeId: string,
  direction: -1 | 1,
  config: TreeLayoutConfig,
): AutoLayoutResult {
  const node = document.nodes[nodeId];
  const nodeHeight = getNodeHeightForLayout(config.layoutType, node);
  const baseLayout: AutoLayoutResult = {
    positions: {
      [nodeId]: { x: 0, y: 0 },
    },
    topContour: [-nodeHeight / 2],
    bottomContour: [nodeHeight / 2],
  };

  if (!node || node.childrenIds.length === 0) {
    return baseLayout;
  }

  const childLayouts = node.childrenIds
    .map((childId) => {
      if (!document.nodes[childId]) {
        return null;
      }

      return buildDirectedTreeLayout(document, childId, direction, config);
    })
    .filter((layout): layout is AutoLayoutResult => layout !== null);

  const childOffsets = stackAutoLayoutSiblings(
    childLayouts,
    1,
    config.verticalGap,
  );

  childLayouts.forEach((layout, index) => {
    const offsetY = childOffsets[index] ?? 0;

    Object.entries(layout.positions).forEach(([childId, position]) => {
      baseLayout.positions[childId] = {
        x: direction * config.horizontalGap + position.x,
        y: offsetY + position.y,
      };
    });

    mergeAutoLayoutContours(
      baseLayout.topContour,
      baseLayout.bottomContour,
      layout.topContour,
      layout.bottomContour,
      offsetY,
      1,
    );
  });

  return baseLayout;
}
