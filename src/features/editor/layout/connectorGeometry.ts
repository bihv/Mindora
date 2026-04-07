import {
  CONNECTOR_CURVE_OFFSET,
  NODE_HEIGHT,
  NODE_WIDTH,
} from "../constants";
import type { Position } from "../types";
import {
  isLogicChartLayoutType,
} from "../../../domain/mindmap/model";
import type { MindMapLayoutType } from "../../../domain/mindmap/model";

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

export function createLogicChartConnectorPath(
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
