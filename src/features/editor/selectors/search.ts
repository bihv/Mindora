import {
  getMindMapNodeSearchTexts,
} from "../../../domain/mindmap/nodeContent";
import type { MindMapDocument } from "../../../domain/mindmap/model";
import type { SearchMatch } from "../types";

export function findSearchMatches(
  document: MindMapDocument,
  query: string,
): SearchMatch[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return Object.values(document.nodes).filter((node) => {
    return getMindMapNodeSearchTexts(node).some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    );
  });
}

export function buildOutlineSearchVisibleSet(
  document: MindMapDocument,
  query: string,
): Set<string> | null {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return null;
  }

  const cache = new Map<string, boolean>();

  const subtreeHasMatch = (nodeId: string): boolean => {
    const cached = cache.get(nodeId);
    if (cached !== undefined) {
      return cached;
    }

    const node = document.nodes[nodeId];
    if (!node) {
      cache.set(nodeId, false);
      return false;
    }

    const selfMatches = getMindMapNodeSearchTexts(node).some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    );
    if (selfMatches) {
      cache.set(nodeId, true);
      return true;
    }

    let anyChild = false;
    for (const childId of node.childrenIds) {
      if (subtreeHasMatch(childId)) {
        anyChild = true;
      }
    }

    cache.set(nodeId, anyChild);
    return anyChild;
  };

  subtreeHasMatch(document.rootId);

  const visible = new Set<string>();
  for (const [id, ok] of cache) {
    if (ok) {
      visible.add(id);
    }
  }

  return visible;
}
