import { getMindMapLayoutType } from "./documents";
import { getNodeHeightForLayout } from "./layout";
import { HORIZONTAL_GAP } from "./layoutMetrics";
import { isClassicMindMapLayoutType, type MindMapDocument } from "./model";
import {
  shouldCompareSiblingBranch,
  syncClassicRootBranchDirections,
} from "./classicBranchSync";
import { getBranchDirection, getSubtreeIds } from "./treeQueries";

export function canReparentNode(
  document: MindMapDocument,
  nodeId: string,
  nextParentId: string,
): boolean {
  const node = document.nodes[nodeId];
  const nextParent = document.nodes[nextParentId];

  if (
    !node ||
    node.parentId === null ||
    !nextParent ||
    node.parentId === nextParentId ||
    nodeId === nextParentId
  ) {
    return false;
  }

  return !new Set(getSubtreeIds(document, nodeId)).has(nextParentId);
}

export function reparentNode(
  document: MindMapDocument,
  nodeId: string,
  nextParentId: string,
  options?: { rootDirection?: -1 | 1 },
): { document: MindMapDocument; nodeId: string; moved: boolean } {
  if (!canReparentNode(document, nodeId, nextParentId)) {
    return { document, nodeId, moved: false };
  }

  const node = document.nodes[nodeId];
  const previousParentId = node.parentId;
  const nextParent = document.nodes[nextParentId];

  if (!previousParentId || !nextParent) {
    return { document, nodeId, moved: false };
  }

  const previousParent = document.nodes[previousParentId];
  if (previousParent) {
    document.nodes[previousParent.id] = {
      ...previousParent,
      childrenIds: previousParent.childrenIds.filter(
        (childId) => childId !== nodeId,
      ),
    };
  }

  document.nodes[nextParent.id] = {
    ...nextParent,
    childrenIds: [
      ...nextParent.childrenIds.filter((childId) => childId !== nodeId),
      nodeId,
    ],
    collapsed: false,
  };
  document.nodes[nodeId] = {
    ...node,
    parentId: nextParent.id,
  };

  alignReparentedSubtree(document, nodeId, nextParent.id, options?.rootDirection);

  if (isClassicMindMapLayoutType(getMindMapLayoutType(document))) {
    syncClassicRootBranchDirections(document);
  }

  return {
    document,
    nodeId,
    moved: true,
  };
}

export function getSubtreeVerticalBounds(
  document: MindMapDocument,
  nodeId: string,
): { minY: number; maxY: number } | null {
  const layoutType = getMindMapLayoutType(document);
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  getSubtreeIds(document, nodeId).forEach((currentId) => {
    const currentNode = document.nodes[currentId];
    if (!currentNode) {
      return;
    }

    const nodeHeight = getNodeHeightForLayout(layoutType, currentNode);
    minY = Math.min(minY, currentNode.y);
    maxY = Math.max(maxY, currentNode.y + nodeHeight);
  });

  if (!Number.isFinite(minY) || !Number.isFinite(maxY)) {
    return null;
  }

  return { minY, maxY };
}

export function offsetDuplicatedSubtreeForClassicLayout(
  document: MindMapDocument,
  sourceNodeId: string,
  duplicatedNodeId: string,
  verticalGap: number,
): void {
  const sourceNode = document.nodes[sourceNodeId];
  const duplicatedNode = document.nodes[duplicatedNodeId];
  if (!sourceNode || !duplicatedNode || !sourceNode.parentId) {
    return;
  }

  const parent = document.nodes[sourceNode.parentId];
  if (!parent) {
    return;
  }

  const duplicatedBounds = getSubtreeVerticalBounds(document, duplicatedNodeId);
  if (!duplicatedBounds) {
    return;
  }

  const siblingBottom = parent.childrenIds
    .filter((siblingId) => siblingId !== duplicatedNodeId)
    .filter((siblingId) =>
      shouldCompareSiblingBranch(document, sourceNodeId, parent.id, siblingId),
    )
    .reduce((maxBottom, siblingId) => {
      const siblingBounds = getSubtreeVerticalBounds(document, siblingId);
      return siblingBounds ? Math.max(maxBottom, siblingBounds.maxY) : maxBottom;
    }, Number.NEGATIVE_INFINITY);

  if (!Number.isFinite(siblingBottom)) {
    return;
  }

  const deltaY = siblingBottom + verticalGap - duplicatedBounds.minY;
  if (deltaY <= 0) {
    return;
  }

  getSubtreeIds(document, duplicatedNodeId).forEach((currentId) => {
    const currentNode = document.nodes[currentId];
    if (!currentNode) {
      return;
    }

    document.nodes[currentId] = {
      ...currentNode,
      y: currentNode.y + deltaY,
    };
  });
}

function alignReparentedSubtree(
  document: MindMapDocument,
  nodeId: string,
  parentId: string,
  rootDirection?: -1 | 1,
): void {
  const node = document.nodes[nodeId];
  const parent = document.nodes[parentId];

  if (!node || !parent) {
    return;
  }

  const direction =
    parent.parentId === null
      ? rootDirection ?? (node.x < parent.x ? -1 : 1)
      : getBranchDirection(document, parent.id);
  const desiredX = parent.x + direction * HORIZONTAL_GAP;

  if (
    (direction === 1 && node.x >= desiredX) ||
    (direction === -1 && node.x <= desiredX)
  ) {
    return;
  }

  const deltaX = desiredX - node.x;
  for (const currentId of getSubtreeIds(document, nodeId)) {
    const currentNode = document.nodes[currentId];
    if (!currentNode) {
      continue;
    }

    document.nodes[currentId] = {
      ...currentNode,
      x: currentNode.x + deltaX,
    };
  }
}
