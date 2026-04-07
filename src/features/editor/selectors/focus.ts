import { getSubtreeIds } from "../../../domain/mindmap/treeQueries";
import type { MindMapDocument } from "../../../domain/mindmap/model";
import type { NodeFocusState } from "../types";

export function buildSelectedLineageSet(
  document: MindMapDocument,
  selectedNodeId: string,
  hasActiveSelection: boolean,
): Set<string> {
  const lineage = new Set<string>();
  if (!hasActiveSelection) {
    return lineage;
  }

  let currentNode: MindMapDocument["nodes"][string] | undefined =
    document.nodes[selectedNodeId];

  while (currentNode) {
    lineage.add(currentNode.id);
    currentNode = currentNode.parentId
      ? document.nodes[currentNode.parentId]
      : undefined;
  }

  return lineage;
}

export function buildSelectedDescendantSet(
  document: MindMapDocument,
  selectedNodeId: string,
  hasActiveSelection: boolean,
): Set<string> {
  if (!hasActiveSelection) {
    return new Set<string>();
  }

  const descendants = new Set(getSubtreeIds(document, selectedNodeId));
  descendants.delete(selectedNodeId);
  return descendants;
}

export function buildNodeFocusStates(
  visibleNodeIds: string[],
  hasActiveSelection: boolean,
  selectedNodeId: string,
  selectedLineageSet: Set<string>,
  selectedDescendantSet: Set<string>,
): Record<string, NodeFocusState> {
  return Object.fromEntries(
    visibleNodeIds.map((nodeId) => {
      let focusState: NodeFocusState;

      if (!hasActiveSelection) {
        focusState = "lineage";
      } else if (nodeId === selectedNodeId) {
        focusState = "selected";
      } else if (selectedLineageSet.has(nodeId)) {
        focusState = "lineage";
      } else if (selectedDescendantSet.has(nodeId)) {
        focusState = "descendant";
      } else {
        focusState = "dimmed";
      }

      return [nodeId, focusState];
    }),
  ) as Record<string, NodeFocusState>;
}
