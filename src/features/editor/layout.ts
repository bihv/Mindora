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
import {
  getClassicRootBranchDirection,
  getMindMapLayoutType,
  getNodeHeightForLayout,
  isLogicChartLayoutType,
  type MindMapDocument,
  type MindMapLayoutType,
} from "../../mindmap";

type AutoLayoutResult = {
  positions: Record<string, Position>;
  topContour: Array<number | undefined>;
  bottomContour: Array<number | undefined>;
};

type TreeLayoutConfig = {
  horizontalGap: number;
  verticalGap: number;
  layoutType: MindMapLayoutType;
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

export function createLayoutConnectorPath(
  layoutType: MindMapLayoutType,
  parentPosition: Position,
  childPosition: Position,
  direction: -1 | 1,
  minimumCurveOffset = CONNECTOR_CURVE_OFFSET,
  parentSize?: { width: number; height: number },
  childSize?: { width: number; height: number },
) {
  if (isLogicChartLayoutType(layoutType)) {
    return createLogicChartConnectorPath(
      parentPosition,
      childPosition,
      direction,
      minimumCurveOffset,
      parentSize,
      childSize,
    );
  }

  return createConnectorPath(
    parentPosition,
    childPosition,
    direction,
    minimumCurveOffset,
    parentSize,
    childSize,
  );
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
  return buildLayoutPositions(document, getMindMapLayoutType(document));
}

export function buildLayoutPositions(
  document: MindMapDocument,
  layoutType: MindMapLayoutType,
): Record<string, Position> {
  return isLogicChartLayoutType(layoutType)
    ? buildLogicChartLayoutPositions(document, layoutType)
    : buildMindMapLayoutPositions(document, layoutType);
}

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

        return buildDirectedTreeLayout(
          document,
          childId,
          direction,
          config,
        );
      })
      .filter((layout): layout is AutoLayoutResult => layout !== null);

    const offsets = stackAutoLayoutSiblings(
      layouts,
      1,
      config.verticalGap,
    );

    layouts.forEach((layout, index) => {
      const offsetY = offsets[index] ?? 0;

      Object.entries(layout.positions).forEach(([nodeId, position]) => {
        const currentNode = document.nodes[nodeId];
        const nodeHeight = getNodeHeightForLayout(layoutType, currentNode);
        positions[nodeId] = {
          x:
            rootNode.x +
            direction * config.horizontalGap +
            position.x,
          y: rootCenterY + offsetY + position.y - nodeHeight / 2,
        };
      });
    });
  };

  layoutRootSide(leftChildren, -1);
  layoutRootSide(rightChildren, 1);

  return positions;
}

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

      return buildDirectedTreeLayout(
        document,
        childId,
        1,
        config,
      );
    })
    .filter((layout): layout is AutoLayoutResult => layout !== null);
  const offsets = stackAutoLayoutSiblings(
    layouts,
    1,
    config.verticalGap,
  );

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

function buildDirectedTreeLayout(
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

function stackAutoLayoutSiblings(
  layouts: AutoLayoutResult[],
  depthOffset: number,
  verticalGap: number,
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
        : calculateAutoLayoutOffset(
            stackedBottom,
            layout.topContour,
            depthOffset,
            verticalGap,
          );

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
  verticalGap: number,
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
      existingBottom + verticalGap - value,
    );
  });

  return requiredOffset;
}

function createLogicChartConnectorPath(
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
  const minTail = Math.max(minimumCurveOffset * 0.52, 3);
  const maxTail = Math.max(minimumCurveOffset * 1.4, minTail);
  const lineTail = Math.max(
    minTail,
    Math.min(Math.abs(endX - startX) * 0.34, maxTail),
  );
  const bendX = endX - direction * lineTail;
  const curveOffset = Math.max(
    Math.min(minimumCurveOffset * 0.45, 52),
    Math.abs(bendX - startX) * 0.48,
  );
  const bendControlOffset = Math.max(
    curveOffset * 0.22,
    minimumCurveOffset * 0.24,
  );

  return `M ${startX} ${startY} C ${
    startX + direction * curveOffset
  } ${startY}, ${
    bendX - direction * bendControlOffset
  } ${endY}, ${bendX} ${endY} L ${endX} ${endY}`;
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
