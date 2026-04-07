import {
  getMindMapBackgroundPresetId,
  getMindMapLayoutType,
} from "../../domain/mindmap/documents";
import { getNodeHeightForLayout, getNodeSizeForLayout } from "../../domain/mindmap/layout";
import { NODE_COLORS } from "../../domain/mindmap/model";
import type { MindMapDocument } from "../../domain/mindmap/model";
import { getBranchDirection, getSubtreeIds } from "../../domain/mindmap/treeQueries";
import { CONNECTOR_CURVE_OFFSET, NODE_WIDTH } from "../editor/constants";
import { createLayoutConnectorPath } from "../editor/layout";
import type { Position } from "../editor/types";
import { EXPORT_PADDING, type ExportSnapshot } from "./config";

export function buildExportSnapshot(document: MindMapDocument): ExportSnapshot {
  const backgroundPresetId = getMindMapBackgroundPresetId(document);
  const layoutType = getMindMapLayoutType(document);
  const nodeHeight = getNodeHeightForLayout(layoutType);
  const nodeIds = getSubtreeIds(document, document.rootId).filter(
    (nodeId) => document.nodes[nodeId],
  );
  const positions = Object.fromEntries(
    nodeIds.map((nodeId) => {
      const node = document.nodes[nodeId];

      return [
        nodeId,
        {
          x: node.x,
          y: node.y,
        },
      ];
    }),
  ) as Record<string, Position>;

  if (nodeIds.length === 0) {
    return {
      backgroundPresetId,
      connectors: [],
      height: nodeHeight + EXPORT_PADDING * 2,
      layoutType,
      nodes: [],
      width: NODE_WIDTH + EXPORT_PADDING * 2,
    };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const nodeId of nodeIds) {
    const node = document.nodes[nodeId];
    const position = positions[nodeId];
    const currentNodeHeight = getNodeHeightForLayout(layoutType, node);

    minX = Math.min(minX, position.x);
    minY = Math.min(minY, position.y);
    maxX = Math.max(maxX, position.x + NODE_WIDTH);
    maxY = Math.max(maxY, position.y + currentNodeHeight);
  }

  const offsetX = EXPORT_PADDING - minX;
  const offsetY = EXPORT_PADDING - minY;
  const normalizedPositions = Object.fromEntries(
    Object.entries(positions).map(([nodeId, position]) => [
      nodeId,
      {
        x: position.x + offsetX,
        y: position.y + offsetY,
      },
    ]),
  ) as Record<string, Position>;
  const nodes = nodeIds.map((nodeId) => ({
    direction:
      document.nodes[nodeId].parentId === null
        ? 1
        : getBranchDirection(document, nodeId),
    height: getNodeHeightForLayout(layoutType, document.nodes[nodeId]),
    node: document.nodes[nodeId],
    x: normalizedPositions[nodeId].x,
    y: normalizedPositions[nodeId].y,
  }));
  const connectors = nodeIds
    .filter((nodeId) => nodeId !== document.rootId)
    .map((nodeId) => {
      const node = document.nodes[nodeId];

      if (!node.parentId) {
        return null;
      }

      const parentPosition = normalizedPositions[node.parentId];
      const childPosition = normalizedPositions[nodeId];

      if (!parentPosition || !childPosition) {
        return null;
      }

      return {
        color: NODE_COLORS[node.color].accent,
        path: createLayoutConnectorPath(
          layoutType,
          parentPosition,
          childPosition,
          getBranchDirection(document, nodeId),
          CONNECTOR_CURVE_OFFSET,
          getNodeSizeForLayout(layoutType, document.nodes[node.parentId]),
          getNodeSizeForLayout(layoutType, node),
        ),
      };
    })
    .filter(
      (
        connector,
      ): connector is {
        color: string;
        path: string;
      } => connector !== null,
    );

  return {
    backgroundPresetId,
    connectors,
    height: Math.ceil(maxY - minY + EXPORT_PADDING * 2),
    layoutType,
    nodes,
    width: Math.ceil(maxX - minX + EXPORT_PADDING * 2),
  };
}
