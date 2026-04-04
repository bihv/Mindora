import {
  AUTO_LAYOUT_HORIZONTAL_GAP,
  AUTO_LAYOUT_VERTICAL_GAP,
  CONNECTOR_CURVE_OFFSET,
  NODE_HEIGHT,
  NODE_WIDTH,
} from "./constants";
import type {
  ConnectorFocusState,
  NodeFocusState,
  Position,
} from "./types";
import type { MindMapDocument } from "../../mindmap";

type AutoLayoutResult = {
  positions: Record<string, Position>;
  topContour: Array<number | undefined>;
  bottomContour: Array<number | undefined>;
};

export function getConnectorPoints(
  parentPosition: Position,
  childPosition: Position,
  direction: -1 | 1,
  parentSize: { width: number; height: number } = {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  },
  childSize: { width: number; height: number } = {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  },
) {
  return {
    startX: parentPosition.x + (direction === 1 ? parentSize.width : 0),
    startY: parentPosition.y + parentSize.height / 2,
    endX: childPosition.x + (direction === 1 ? 0 : childSize.width),
    endY: childPosition.y + childSize.height / 2,
  };
}

export function createConnectorPath(
  parentPosition: Position,
  childPosition: Position,
  direction: -1 | 1,
  minimumCurveOffset = CONNECTOR_CURVE_OFFSET,
  parentSize?: { width: number; height: number },
  childSize?: { width: number; height: number },
) {
  const { startX, startY, endX, endY } = getConnectorPoints(
    parentPosition,
    childPosition,
    direction,
    parentSize,
    childSize,
  );
  const curveOffset = Math.max(
    minimumCurveOffset,
    Math.abs(endX - startX) * 0.45,
  );

  return `M ${startX} ${startY} C ${
    startX + direction * curveOffset
  } ${startY}, ${
    endX - direction * curveOffset
  } ${endY}, ${endX} ${endY}`;
}

export function getConnectorFocusState(
  parentFocusState: NodeFocusState,
  childFocusState: NodeFocusState,
): ConnectorFocusState {
  if (
    (childFocusState === "selected" || childFocusState === "lineage") &&
    (parentFocusState === "selected" || parentFocusState === "lineage")
  ) {
    return "lineage";
  }

  if (
    (childFocusState === "descendant" || childFocusState === "selected") &&
    (parentFocusState === "descendant" || parentFocusState === "selected")
  ) {
    return "descendant";
  }

  return "dimmed";
}

export function buildAutoLayoutPositions(
  document: MindMapDocument,
): Record<string, Position> {
  const positions = Object.fromEntries(
    Object.values(document.nodes).map((node) => [node.id, { x: node.x, y: node.y }]),
  ) as Record<string, Position>;
  const rootNode = document.nodes[document.rootId];

  if (!rootNode) {
    return positions;
  }

  positions[rootNode.id] = { x: rootNode.x, y: rootNode.y };
  const rootCenterY = rootNode.y + NODE_HEIGHT / 2;
  const leftChildren: string[] = [];
  const rightChildren: string[] = [];

  rootNode.childrenIds.forEach((childId, index) => {
    const childNode = document.nodes[childId];
    if (!childNode) {
      return;
    }

    if (childNode.x < rootNode.x) {
      leftChildren.push(childId);
      return;
    }

    if (childNode.x > rootNode.x) {
      rightChildren.push(childId);
      return;
    }

    if (index % 2 === 0) {
      rightChildren.push(childId);
    } else {
      leftChildren.push(childId);
    }
  });

  const layoutRootSide = (childIds: string[], direction: -1 | 1) => {
    const layouts = childIds
      .map((childId) => {
        const node = document.nodes[childId];
        if (!node) {
          return null;
        }

        return buildDirectedTreeLayout(document, childId, direction);
      })
      .filter((layout): layout is AutoLayoutResult => layout !== null);

    const offsets = stackAutoLayoutSiblings(layouts, 1);

    layouts.forEach((layout, index) => {
      const offsetY = offsets[index] ?? 0;

      Object.entries(layout.positions).forEach(([nodeId, position]) => {
        positions[nodeId] = {
          x: rootNode.x + direction * AUTO_LAYOUT_HORIZONTAL_GAP + position.x,
          y: rootCenterY + offsetY + position.y - NODE_HEIGHT / 2,
        };
      });
    });
  };

  layoutRootSide(leftChildren, -1);
  layoutRootSide(rightChildren, 1);

  return positions;
}

function buildDirectedTreeLayout(
  document: MindMapDocument,
  nodeId: string,
  direction: -1 | 1,
): AutoLayoutResult {
  const node = document.nodes[nodeId];
  const baseLayout: AutoLayoutResult = {
    positions: {
      [nodeId]: { x: 0, y: 0 },
    },
    topContour: [-NODE_HEIGHT / 2],
    bottomContour: [NODE_HEIGHT / 2],
  };

  if (!node || node.childrenIds.length === 0) {
    return baseLayout;
  }

  const childLayouts = node.childrenIds
    .map((childId) => {
      if (!document.nodes[childId]) {
        return null;
      }

      return buildDirectedTreeLayout(document, childId, direction);
    })
    .filter((layout): layout is AutoLayoutResult => layout !== null);

  const childOffsets = stackAutoLayoutSiblings(childLayouts, 1);

  childLayouts.forEach((layout, index) => {
    const offsetY = childOffsets[index] ?? 0;

    Object.entries(layout.positions).forEach(([childId, position]) => {
      baseLayout.positions[childId] = {
        x: direction * AUTO_LAYOUT_HORIZONTAL_GAP + position.x,
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

function stackAutoLayoutSiblings(
  layouts: AutoLayoutResult[],
  depthOffset: number,
): number[] {
  if (layouts.length === 0) {
    return [];
  }

  const offsets: number[] = [];
  const stackedTop: Array<number | undefined> = [];
  const stackedBottom: Array<number | undefined> = [];

  layouts.forEach((layout, index) => {
    const offsetY =
      index === 0
        ? 0
        : calculateAutoLayoutOffset(stackedBottom, layout.topContour, depthOffset);

    offsets.push(offsetY);
    mergeAutoLayoutContours(
      stackedTop,
      stackedBottom,
      layout.topContour,
      layout.bottomContour,
      offsetY,
      depthOffset,
    );
  });

  const shift =
    layouts.length === 1
      ? offsets[0] ?? 0
      : ((offsets[0] ?? 0) + (offsets[offsets.length - 1] ?? 0)) / 2;

  return offsets.map((offset) => offset - shift);
}

function calculateAutoLayoutOffset(
  stackedBottom: Array<number | undefined>,
  nextTop: Array<number | undefined>,
  depthOffset: number,
): number {
  let requiredOffset = 0;

  nextTop.forEach((value, depth) => {
    if (value === undefined) {
      return;
    }

    const existingBottom = stackedBottom[depth + depthOffset];
    if (existingBottom === undefined) {
      return;
    }

    requiredOffset = Math.max(
      requiredOffset,
      existingBottom + AUTO_LAYOUT_VERTICAL_GAP - value,
    );
  });

  return requiredOffset;
}

function mergeAutoLayoutContours(
  targetTop: Array<number | undefined>,
  targetBottom: Array<number | undefined>,
  sourceTop: Array<number | undefined>,
  sourceBottom: Array<number | undefined>,
  offsetY: number,
  depthOffset: number,
): void {
  sourceTop.forEach((value, depth) => {
    if (value === undefined) {
      return;
    }

    const targetDepth = depth + depthOffset;
    const nextValue = value + offsetY;
    const currentTop = targetTop[targetDepth];

    targetTop[targetDepth] =
      currentTop === undefined ? nextValue : Math.min(currentTop, nextValue);
  });

  sourceBottom.forEach((value, depth) => {
    if (value === undefined) {
      return;
    }

    const targetDepth = depth + depthOffset;
    const nextValue = value + offsetY;
    const currentBottom = targetBottom[targetDepth];

    targetBottom[targetDepth] =
      currentBottom === undefined ? nextValue : Math.max(currentBottom, nextValue);
  });
}
