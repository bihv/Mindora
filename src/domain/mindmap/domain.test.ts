import { describe, expect, it } from "vitest";
import {
  cloneMindMapDocument,
  createBlankMindMap,
  hydrateMindMapDocument,
} from "./documents";
import { setMindMapNodeKind } from "./nodeContent";
import {
  createChildNode,
  deleteNode,
  duplicateNodeSubtree,
  expandAllNodes,
} from "./nodeMutations";
import { reparentNode } from "./reparenting";
import { MIND_MAP_TEMPLATES } from "./templates";
import { resolveSelectedNodeId } from "./treeQueries";

describe("mindmap domain", () => {
  it("creates, duplicates, reparents, and deletes nodes without breaking selection", () => {
    const document = createBlankMindMap("Planning");
    const firstBranch = createChildNode(document, document.rootId, "Branch A").nodeId;
    const secondBranch = createChildNode(document, document.rootId, "Branch B").nodeId;
    const child = createChildNode(document, firstBranch, "Child").nodeId;

    const duplicated = duplicateNodeSubtree(document, firstBranch).nodeId;
    expect(document.nodes[duplicated]).toBeDefined();

    const reparented = reparentNode(document, child, secondBranch);
    expect(reparented.moved).toBe(true);
    expect(document.nodes[child].parentId).toBe(secondBranch);

    const deleted = deleteNode(document, firstBranch);
    expect(document.nodes[firstBranch]).toBeUndefined();
    expect(deleted.selectedNodeId).toBe(document.rootId);
    expect(resolveSelectedNodeId(document, firstBranch)).toBe(document.rootId);
  });

  it("hydrates node data and expands collapsed nodes", () => {
    const document = createBlankMindMap();
    const branchId = createChildNode(document, document.rootId, "Media").nodeId;
    document.nodes[branchId] = {
      ...setMindMapNodeKind(document.nodes[branchId], "image"),
      collapsed: true,
      data: {} as never,
    };

    const hydrated = hydrateMindMapDocument(cloneMindMapDocument(document));
    expect(hydrated.nodes[branchId].kind).toBe("image");
    expect(hydrated.nodes[branchId].data).toEqual({ imageUrl: "" });

    expandAllNodes(hydrated);
    expect(hydrated.nodes[branchId].collapsed).toBe(false);
  });

  it("keeps template generation wired through domain modules", () => {
    const weeklyReview = MIND_MAP_TEMPLATES.find(
      (template: (typeof MIND_MAP_TEMPLATES)[number]) =>
        template.id === "weekly-review",
    );
    const weeklyReviewDocument = weeklyReview?.create();

    expect(weeklyReview).toBeDefined();
    expect(weeklyReviewDocument?.title).toBe("Weekly Review");
    expect(
      weeklyReviewDocument?.nodes[weeklyReviewDocument.rootId],
    ).toBeDefined();
  });
});
