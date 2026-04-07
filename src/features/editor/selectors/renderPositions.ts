import type { DraggingState, Position } from "../types";
import type { MindMapDocument } from "../../../domain/mindmap/model";

export function buildRenderPositions(
  document: MindMapDocument,
  dragging: DraggingState | null,
): Record<string, Position> {
  const positions = Object.fromEntries(
    Object.values(document.nodes).map((node) => [node.id, { x: node.x, y: node.y }]),
  ) as Record<string, Position>;

  if (!dragging) {
    return positions;
  }

  for (const nodeId of dragging.subtreeIds) {
    const origin = dragging.originPositions[nodeId];
    if (!origin) {
      continue;
    }

    positions[nodeId] = {
      x: origin.x + dragging.delta.x,
      y: origin.y + dragging.delta.y,
    };
  }

  return positions;
}
