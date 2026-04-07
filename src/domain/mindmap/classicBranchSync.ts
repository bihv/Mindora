import { type MindMapDocument } from "./model";
import { getBranchDirection } from "./treeQueries";

export function getClassicRootBranchDirection(
  document: MindMapDocument,
  childId: string,
  index: number,
): -1 | 1 {
  const rootNode = document.nodes[document.rootId];
  const childNode = document.nodes[childId];

  if (!rootNode || !childNode) {
    return index % 2 === 0 ? 1 : -1;
  }

  if (childNode.classicDirection === -1 || childNode.classicDirection === 1) {
    return childNode.classicDirection;
  }

  if (childNode.x < rootNode.x) {
    return -1;
  }

  if (childNode.x > rootNode.x) {
    return 1;
  }

  return index % 2 === 0 ? 1 : -1;
}

export function syncClassicRootBranchDirections(
  document: MindMapDocument,
): MindMapDocument {
  const rootNode = document.nodes[document.rootId];

  if (!rootNode) {
    return document;
  }

  rootNode.childrenIds.forEach((childId, index) => {
    const childNode = document.nodes[childId];
    if (!childNode) {
      return;
    }

    const classicDirection =
      childNode.x < rootNode.x
        ? -1
        : childNode.x > rootNode.x
          ? 1
          : (childNode.classicDirection ?? (index % 2 === 0 ? 1 : -1));

    if (childNode.classicDirection === classicDirection) {
      return;
    }

    document.nodes[childId] = {
      ...childNode,
      classicDirection,
    };
  });

  return document;
}

export function shouldCompareSiblingBranch(
  document: MindMapDocument,
  referenceNodeId: string,
  parentId: string,
  siblingId: string,
): boolean {
  const parent = document.nodes[parentId];
  if (!parent) {
    return false;
  }

  if (parent.parentId !== null) {
    return true;
  }

  return (
    getBranchDirection(document, referenceNodeId) ===
    getBranchDirection(document, siblingId)
  );
}
