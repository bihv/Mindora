import {
  createMindMapId,
  createMindMapNode,
  getMindMapLayoutType,
} from "./documents";
import { HORIZONTAL_GAP, VERTICAL_GAP } from "./layoutMetrics";
import { isClassicMindMapLayoutType, type MindMapDocument } from "./model";
import { syncClassicRootBranchDirections } from "./classicBranchSync";
import {
  getBranchDirection,
  getSubtreeIds,
  resolveSelectedNodeId,
} from "./treeQueries";
import { offsetDuplicatedSubtreeForClassicLayout } from "./reparenting";

export function createChildNode(
  document: MindMapDocument,
  parentId: string,
  title = "New Idea",
): { document: MindMapDocument; nodeId: string } {
  const parent = document.nodes[parentId];
  if (!parent) {
    return { document, nodeId: document.rootId };
  }

  const siblingCount = parent.childrenIds.length;
  const direction =
    parent.parentId === null
      ? siblingCount % 2 === 0
        ? 1
        : -1
      : getBranchDirection(document, parent.id);
  const positionIndex =
    parent.parentId === null ? Math.floor(siblingCount / 2) : siblingCount;
  const verticalOffset =
    parent.parentId === null
      ? (siblingCount % 2 === 0 ? -1 : 1) * positionIndex * VERTICAL_GAP
      : siblingCount * VERTICAL_GAP;

  const newNode = createMindMapNode({
    title,
    classicDirection: parent.parentId === null ? direction : undefined,
    x: parent.x + direction * HORIZONTAL_GAP,
    y:
      parent.parentId === null
        ? parent.y + verticalOffset
        : parent.y +
          verticalOffset -
          (Math.max(siblingCount - 1, 0) * VERTICAL_GAP) / 2,
    parentId: parent.id,
    color: parent.color,
  });

  document.nodes[parent.id] = {
    ...parent,
    childrenIds: [...parent.childrenIds, newNode.id],
    collapsed: false,
  };
  document.nodes[newNode.id] = newNode;

  return { document, nodeId: newNode.id };
}

export function createSiblingNode(
  document: MindMapDocument,
  nodeId: string,
): { document: MindMapDocument; nodeId: string } {
  const node = document.nodes[nodeId];
  if (!node || !node.parentId) {
    return createChildNode(document, document.rootId);
  }

  return createChildNode(document, node.parentId);
}

export function duplicateNodeSubtree(
  document: MindMapDocument,
  nodeId: string,
): { document: MindMapDocument; nodeId: string } {
  const sourceNode = document.nodes[nodeId];
  if (!sourceNode || sourceNode.parentId === null) {
    return { document, nodeId: document.rootId };
  }

  const parent = document.nodes[sourceNode.parentId];
  if (!parent) {
    return { document, nodeId: document.rootId };
  }

  const sourceSubtreeIds = getSubtreeIds(document, nodeId);
  const sourceSubtreeIdSet = new Set(sourceSubtreeIds);
  const duplicatedIds = new Map(
    sourceSubtreeIds.map((sourceId) => [sourceId, createMindMapId()]),
  );
  const duplicatedRootId = duplicatedIds.get(nodeId) ?? document.rootId;

  sourceSubtreeIds.forEach((sourceId) => {
    const currentNode = document.nodes[sourceId];
    const nextNodeId = duplicatedIds.get(sourceId);
    if (!currentNode || !nextNodeId) {
      return;
    }

    const nextParentId =
      sourceId === nodeId
        ? sourceNode.parentId
        : currentNode.parentId
          ? duplicatedIds.get(currentNode.parentId)
          : null;

    document.nodes[nextNodeId] = {
      ...currentNode,
      id: nextNodeId,
      parentId: nextParentId ?? sourceNode.parentId,
      childrenIds: currentNode.childrenIds
        .filter((childId) => sourceSubtreeIdSet.has(childId))
        .map((childId) => duplicatedIds.get(childId) ?? childId),
    };
  });

  const sourceIndex = parent.childrenIds.indexOf(nodeId);
  const nextChildrenIds = [...parent.childrenIds];
  const insertIndex =
    sourceIndex === -1 ? nextChildrenIds.length : sourceIndex + 1;
  nextChildrenIds.splice(insertIndex, 0, duplicatedRootId);

  document.nodes[parent.id] = {
    ...parent,
    childrenIds: nextChildrenIds,
    collapsed: false,
  };

  if (isClassicMindMapLayoutType(getMindMapLayoutType(document))) {
    offsetDuplicatedSubtreeForClassicLayout(
      document,
      nodeId,
      duplicatedRootId,
      VERTICAL_GAP,
    );
  }

  return {
    document,
    nodeId: duplicatedRootId,
  };
}

export function updateNodePosition(
  document: MindMapDocument,
  positions: Record<string, { x: number; y: number }>,
): MindMapDocument {
  for (const [nodeId, position] of Object.entries(positions)) {
    const node = document.nodes[nodeId];
    if (!node) {
      continue;
    }

    document.nodes[nodeId] = {
      ...node,
      x: position.x,
      y: position.y,
    };
  }

  if (isClassicMindMapLayoutType(getMindMapLayoutType(document))) {
    syncClassicRootBranchDirections(document);
  }

  return document;
}

export function deleteNode(
  document: MindMapDocument,
  nodeId: string,
): { document: MindMapDocument; selectedNodeId: string } {
  const node = document.nodes[nodeId];
  if (!node || node.parentId === null) {
    return { document, selectedNodeId: document.rootId };
  }

  const parent = document.nodes[node.parentId];
  if (parent) {
    document.nodes[parent.id] = {
      ...parent,
      childrenIds: parent.childrenIds.filter((childId) => childId !== nodeId),
    };
  }

  for (const currentId of getSubtreeIds(document, nodeId)) {
    delete document.nodes[currentId];
  }

  return {
    document,
    selectedNodeId: resolveSelectedNodeId(document, node.parentId),
  };
}

export function expandAllNodes(document: MindMapDocument): MindMapDocument {
  for (const nodeId of Object.keys(document.nodes)) {
    const node = document.nodes[nodeId];
    document.nodes[nodeId] = {
      ...node,
      collapsed: false,
    };
  }

  return document;
}
