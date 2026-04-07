import type { MindMapDocument } from "./model";

export function getBranchDirection(
  document: MindMapDocument,
  nodeId: string,
): -1 | 1 {
  const node = document.nodes[nodeId];

  if (!node || node.parentId === null) {
    return 1;
  }

  const parent = document.nodes[node.parentId];
  if (!parent) {
    return 1;
  }

  if (parent.parentId === null) {
    return node.x >= parent.x ? 1 : -1;
  }

  return getBranchDirection(document, parent.id);
}

export function getSubtreeIds(
  document: MindMapDocument,
  nodeId: string,
): string[] {
  const result: string[] = [];
  const stack = [nodeId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) {
      continue;
    }

    result.push(currentId);
    const currentNode = document.nodes[currentId];
    if (!currentNode) {
      continue;
    }

    for (let index = currentNode.childrenIds.length - 1; index >= 0; index -= 1) {
      stack.push(currentNode.childrenIds[index]);
    }
  }

  return result;
}

export function getVisibleNodeIds(document: MindMapDocument): string[] {
  const result: string[] = [];
  const stack = [document.rootId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) {
      continue;
    }

    result.push(currentId);
    const currentNode = document.nodes[currentId];
    if (!currentNode || currentNode.collapsed) {
      continue;
    }

    for (let index = currentNode.childrenIds.length - 1; index >= 0; index -= 1) {
      stack.push(currentNode.childrenIds[index]);
    }
  }

  return result;
}

export function resolveSelectedNodeId(
  document: MindMapDocument,
  preferredNodeId: string | null | undefined,
): string {
  if (preferredNodeId && document.nodes[preferredNodeId]) {
    return preferredNodeId;
  }

  return document.rootId;
}
