import { describe, expect, it } from "vitest";
import { createBlankMindMap } from "../../domain/mindmap/documents";
import { createChildNode } from "../../domain/mindmap/nodeMutations";
import { buildAutoLayoutPositions, createLayoutConnectorPath } from "./layout";

describe("editor layout barrel", () => {
  it("builds distinct connector geometry for classic and logic-chart layouts", () => {
    const parent = { x: 100, y: 100 };
    const child = { x: 400, y: 180 };

    const classicPath = createLayoutConnectorPath(
      "mindmap-card",
      parent,
      child,
      1,
    );
    const logicPath = createLayoutConnectorPath(
      "logic-chart-card",
      parent,
      child,
      1,
    );

    expect(classicPath).toContain("C");
    expect(logicPath).toContain("L");
    expect(logicPath).not.toEqual(classicPath);
  });

  it("stacks sibling subtrees without collapsing them onto the same y position", () => {
    const document = createBlankMindMap("Layout");
    const left = createChildNode(document, document.rootId, "Left").nodeId;
    const right = createChildNode(document, document.rootId, "Right").nodeId;
    const leftChildA = createChildNode(document, left, "Left child A").nodeId;
    const leftChildB = createChildNode(document, left, "Left child B").nodeId;
    const rightChildA = createChildNode(document, right, "Right child A").nodeId;
    const rightChildB = createChildNode(document, right, "Right child B").nodeId;

    const positions = buildAutoLayoutPositions(document);

    expect(positions[leftChildA].y).not.toBe(positions[leftChildB].y);
    expect(positions[rightChildA].y).not.toBe(positions[rightChildB].y);
    expect(positions[document.rootId]).toEqual({
      x: document.nodes[document.rootId].x,
      y: document.nodes[document.rootId].y,
    });
  });
});
