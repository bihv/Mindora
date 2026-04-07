import { describe, expect, it } from "vitest";
import { createBlankMindMap } from "../../domain/mindmap/documents";
import { createChildNode } from "../../domain/mindmap/nodeMutations";
import { buildMindMapExportBlob } from "./index";

describe("export facade", () => {
  it("builds SVG exports through the feature facade", async () => {
    const document = createBlankMindMap("Export demo");
    createChildNode(document, document.rootId, "Branch");

    const blob = await buildMindMapExportBlob(document, "svg");
    const contents = await blob.text();

    expect(blob.type).toBe("image/svg+xml;charset=utf-8");
    expect(contents).toContain("<svg");
    expect(contents).toContain("Central Topic");
  });
});
