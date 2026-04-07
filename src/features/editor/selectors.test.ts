import { describe, expect, it } from "vitest";
import {
  createBlankMindMap,
} from "../../domain/mindmap/documents";
import { createChildNode } from "../../domain/mindmap/nodeMutations";
import { setMindMapNodeKind } from "../../domain/mindmap/nodeContent";
import { buildLayoutPositions } from "./layout";
import {
  buildOutlineSearchVisibleSet,
  findSearchMatches,
} from "./selectors/search";
import { buildRenderPositions } from "./selectors/renderPositions";
import type { DraggingState } from "./types";

describe("editor selectors and layout", () => {
  it("keeps ancestors visible for outline search results", () => {
    const document = createBlankMindMap();
    const parentId = createChildNode(document, document.rootId, "Research").nodeId;
    const childId = createChildNode(document, parentId, "Competitive notes").nodeId;
    document.nodes[childId].notes = "Find the strongest competitors";

    const visibleSet = buildOutlineSearchVisibleSet(document, "competitor");
    expect(visibleSet?.has(document.rootId)).toBe(true);
    expect(visibleSet?.has(parentId)).toBe(true);
    expect(visibleSet?.has(childId)).toBe(true);
    expect(findSearchMatches(document, "competitor").map((node) => node.id)).toEqual([
      childId,
    ]);
  });

  it("applies dragging deltas only to the dragged subtree and returns auto-layout positions", () => {
    const document = createBlankMindMap();
    const parentId = createChildNode(document, document.rootId, "Parent").nodeId;
    const childId = createChildNode(document, parentId, "Child").nodeId;

    const dragging: DraggingState = {
      delta: { x: 40, y: -20 },
      nodeId: parentId,
      originPositions: {
        [parentId]: { x: document.nodes[parentId].x, y: document.nodes[parentId].y },
        [childId]: { x: document.nodes[childId].x, y: document.nodes[childId].y },
      },
      pointerOrigin: { x: 0, y: 0 },
      subtreeIds: [parentId, childId],
      viewportScale: 1,
    };

    const renderPositions = buildRenderPositions(document, dragging);
    expect(renderPositions[parentId].x).toBe(document.nodes[parentId].x + 40);
    expect(renderPositions[childId].y).toBe(document.nodes[childId].y - 20);

    document.nodes[parentId] = setMindMapNodeKind(document.nodes[parentId], "emoji");
    const layoutPositions = buildLayoutPositions(document, document.layoutType ?? "mindmap-card");
    expect(layoutPositions[document.rootId]).toEqual({
      x: document.nodes[document.rootId].x,
      y: document.nodes[document.rootId].y,
    });
    expect(layoutPositions[parentId]).toBeDefined();
  });
});
