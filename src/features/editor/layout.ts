import { getMindMapLayoutType } from "../../domain/mindmap/documents";
import { isLogicChartLayoutType } from "../../domain/mindmap/model";
import type {
  MindMapDocument,
  MindMapLayoutType,
} from "../../domain/mindmap/model";
import type { Position } from "./types";

export * from "./layout/connectorGeometry";
export * from "./layout/focusState";

import { buildLogicChartLayoutPositions } from "./layout/logicChartAutoLayout";
import { buildMindMapLayoutPositions } from "./layout/mindMapAutoLayout";

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
