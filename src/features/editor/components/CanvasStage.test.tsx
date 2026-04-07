import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createBlankMindMap } from "../../../domain/mindmap/documents";
import { createChildNode } from "../../../domain/mindmap/nodeMutations";
import { buildRenderPositions } from "../selectors/renderPositions";
import { CanvasStage } from "./CanvasStage";

describe("CanvasStage", () => {
  it("renders nodes and routes node interactions through the split subcomponents", () => {
    const document = createBlankMindMap("Canvas");
    const childId = createChildNode(document, document.rootId, "Child").nodeId;
    const positions = buildRenderPositions(document, null);

    const onNodeSelect = vi.fn();
    const onToggleCollapsed = vi.fn();

    render(
      <CanvasStage
        backgroundPresetId={document.backgroundPresetId ?? "midnight-grid"}
        camera={{ scale: 1, x: 0, y: 0 }}
        connectors={[]}
        draggingNodeId={null}
        hasActiveSelection={true}
        layoutType={document.layoutType ?? "mindmap-card"}
        mindMap={document}
        nodeFocusStates={{
          [document.rootId]: "selected",
          [childId]: "lineage",
        }}
        onCanvasClick={vi.fn()}
        onNodeConnectorPointerDown={vi.fn()}
        onNodeContextMenu={vi.fn()}
        onNodeImageView={vi.fn()}
        onNodePointerDown={vi.fn()}
        onNodeSelect={onNodeSelect}
        onStagePointerDown={vi.fn()}
        onToggleCollapsed={onToggleCollapsed}
        panning={false}
        previewConnector={null}
        reparentTargetNodeId={null}
        searchMatchIds={new Set<string>()}
        selectedNodeId={document.rootId}
        stagePositions={positions}
        visibleNodeIds={[document.rootId, childId]}
      />,
    );

    fireEvent.click(screen.getByText("Child"));
    expect(onNodeSelect).toHaveBeenCalledWith(childId);

    fireEvent.click(screen.getByLabelText("Collapse node"));
    expect(onToggleCollapsed).toHaveBeenCalledWith(document.rootId);
  });
});
