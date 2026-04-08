import { describe, expect, it } from "vitest";
import { buildAiMindMapDocument } from "./buildMindMapDocument";
import { LOGIC_CHART_CARD_LAYOUT } from "../../domain/mindmap/model";

describe("buildAiMindMapDocument", () => {
  it("builds a capped, auto-laid out mind map from an AI outline", () => {
    const document = buildAiMindMapDocument({
      layoutType: LOGIC_CHART_CARD_LAYOUT,
      outline: {
        children: Array.from({ length: 10 }, (_, branchIndex) => ({
          children: Array.from({ length: 4 }, (_, leafIndex) => ({
            notes: `Leaf note ${branchIndex}-${leafIndex}`,
            title: `Leaf ${branchIndex}-${leafIndex}`,
          })),
          notes: `Branch note ${branchIndex}`,
          title: `Branch ${branchIndex}`,
        })),
        notes: "Root note",
        title: "Roadmap",
      },
      topic: "Q3 roadmap",
    });

    expect(document.title).toBe("Q3 roadmap");
    expect(document.layoutType).toBe(LOGIC_CHART_CARD_LAYOUT);
    expect(document.nodes[document.rootId].title).toBe("Roadmap");
    expect(document.nodes[document.rootId].notes).toBe("Root note");
    expect(Object.keys(document.nodes)).toHaveLength(33);

    const firstBranchIds = document.nodes[document.rootId].childrenIds;
    expect(firstBranchIds).toHaveLength(8);
    expect(document.nodes[firstBranchIds[0]].color).toBe("slate");
    expect(document.nodes[firstBranchIds[1]].color).toBe("teal");

    const firstLeafIds = document.nodes[firstBranchIds[0]].childrenIds;
    expect(firstLeafIds).toHaveLength(3);
    expect(document.nodes[firstLeafIds[0]].color).toBe("slate");
    expect(Number.isFinite(document.nodes[firstLeafIds[0]].x)).toBe(true);
    expect(Number.isFinite(document.nodes[firstLeafIds[0]].y)).toBe(true);
  });
});
