import { useMemo, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import type {
  MindMapNodeKind,
  NodeColor,
} from "../../../../../domain/mindmap/model";
import { clamp } from "../../../../../shared/math";
import {
  NODE_CONTEXT_MENU_GAP,
  NODE_CONTEXT_MENU_WIDTH,
  NODE_WIDTH,
} from "../../../constants";
import type { CameraState, Position } from "../../../types";
import type { ReturnTypeUseMindMapEditor } from "../useEditorWorkspaceCommands";

type UseEditorWorkspacePanelsArgs = {
  camera: CameraState;
  canvasHeight: number;
  canvasWidth: number;
  draggingState: ReturnType<typeof import("../../../hooks/useNodeDragging").useNodeDragging>;
  editor: ReturnTypeUseMindMapEditor;
  nodeFocusStates: Record<
    string,
    import("../../../types").NodeFocusState
  >;
  onNodeImageView: (nodeId: string) => void;
  outlineSearchVisibleSet: Set<string> | null;
  panning: { cameraOrigin: CameraState; pointerOrigin: Position } | null;
  previewConnector: import("../../../types").ConnectorPreviewItem | null;
  reparentingState: ReturnType<typeof import("../../../hooks/useNodeReparenting").useNodeReparenting>;
  searchMatchIds: Set<string>;
  searchMatchesCount: number;
  stagePositions: Record<string, Position>;
  startPanning: (
    event: ReactPointerEvent<HTMLDivElement>,
    onBeforePan?: () => void,
  ) => void;
  visibleConnectors: import("../../../types").ConnectorItem[];
  visibleNodeIdSet: Set<string>;
  visibleNodeIds: string[];
};

export function useEditorWorkspacePanels({
  camera,
  canvasHeight,
  canvasWidth,
  draggingState,
  editor,
  nodeFocusStates,
  onNodeImageView,
  outlineSearchVisibleSet,
  panning,
  previewConnector,
  reparentingState,
  searchMatchIds,
  searchMatchesCount,
  stagePositions,
  startPanning,
  visibleConnectors,
  visibleNodeIdSet,
  visibleNodeIds,
}: UseEditorWorkspacePanelsArgs) {
  const selectedNodePosition = stagePositions[editor.selectedNodeId] ?? {
    x: 24,
    y: 24,
  };
  const scaledNodeWidth = NODE_WIDTH * camera.scale;
  const selectedNodeMenuLeft =
    selectedNodePosition.x +
      scaledNodeWidth +
      NODE_CONTEXT_MENU_WIDTH +
      NODE_CONTEXT_MENU_GAP <
    canvasWidth - 24
      ? selectedNodePosition.x + scaledNodeWidth + NODE_CONTEXT_MENU_GAP
      : Math.max(
          selectedNodePosition.x -
            NODE_CONTEXT_MENU_WIDTH -
            NODE_CONTEXT_MENU_GAP,
          24,
        );
  const selectedNodeMenuTop = clamp(
    selectedNodePosition.y,
    24,
    canvasHeight - 24,
  );
  const totalNodes = Object.keys(editor.mindMap.nodes).length;

  return useMemo(
    () => ({
      backgroundDialog: {
        currentBackgroundPresetId: editor.backgroundPresetId,
        initialBackgroundPresetId: editor.backgroundPanelInitialPresetId,
        isOpen: editor.isBackgroundDialogOpen,
        onClose: editor.closeBackgroundDialog,
        onReset: editor.resetBackgroundDialog,
        onSelect: editor.handleBackgroundPresetChange,
      },
      canvasStage: {
        backgroundPresetId: editor.backgroundPresetId,
        camera,
        connectors: visibleConnectors,
        draggingNodeId: draggingState.dragging?.nodeId ?? null,
        hasActiveSelection: editor.hasActiveSelection,
        layoutType: editor.layoutType,
        mindMap: editor.mindMap,
        nodeFocusStates,
        onCanvasClick: editor.clearSelection,
        onNodeConnectorPointerDown: reparentingState.startReparenting,
        onNodeContextMenu: (
          nodeId: string,
          event: ReactMouseEvent<HTMLElement>,
        ) => {
          event.preventDefault();
          event.stopPropagation();
          editor.selectNode(nodeId, {
            openMenu: true,
            showInspector: true,
          });
        },
        onNodeImageView,
        onNodePointerDown: draggingState.startDragging,
        onNodeSelect: (nodeId: string) =>
          editor.selectNode(nodeId, {
            openMenu: false,
            showInspector: true,
          }),
        onStagePointerDown: (event: ReactPointerEvent<HTMLDivElement>) =>
          startPanning(event, editor.clearSelection),
        onToggleCollapsed: editor.handleToggleCollapsed,
        panning: panning !== null,
        previewConnector,
        reparentTargetNodeId:
          reparentingState.reparenting?.candidateParentId ?? null,
        searchMatchIds,
        selectedNodeId: editor.selectedNodeId,
        stagePositions,
        visibleNodeIds,
      },
      inspectorDrawer: {
        isOpen:
          editor.isInspectorOpen &&
          editor.hasActiveSelection &&
          !editor.isLayoutDialogOpen &&
          !editor.isBackgroundDialogOpen,
        onNodeColorChange: (color: NodeColor) =>
          editor.handleNodeColorChange(editor.selectedNode.id, color),
        onNodeEmojiChange: (value: string) =>
          editor.handleNodeEmojiChange(editor.selectedNode.id, value),
        onNodeImageUrlChange: (value: string) =>
          editor.handleNodeImageUrlChange(editor.selectedNode.id, value),
        onNodeKindChange: (kind: MindMapNodeKind) =>
          editor.handleNodeKindChange(editor.selectedNode.id, kind),
        onNodeLinkUrlChange: (value: string) =>
          editor.handleNodeLinkUrlChange(editor.selectedNode.id, value),
        onNodeNotesChange: (value: string) =>
          editor.handleNodeNotesChange(editor.selectedNode.id, value),
        onNodeTitleChange: (value: string) =>
          editor.handleNodeTitleChange(editor.selectedNode.id, value),
        selectedNode: editor.selectedNode,
      },
      layoutDialog: {
        currentLayoutType: editor.layoutType,
        initialLayoutType: editor.layoutPanelInitialLayoutType,
        isOpen: editor.isLayoutDialogOpen,
        onClose: editor.closeLayoutDialog,
        onReset: editor.resetLayoutDialog,
        onSelect: editor.handleLayoutTypeChange,
      },
      nodeContextMenu: {
        isVisible:
          editor.hasActiveSelection &&
          editor.editorState.isNodeMenuOpen &&
          visibleNodeIdSet.has(editor.selectedNodeId),
        left: selectedNodeMenuLeft,
        onAddChild: () => editor.handleAddChild(editor.selectedNode.id),
        onAddSibling: () => editor.handleAddSibling(editor.selectedNode.id),
        onDelete: editor.handleDeleteSelected,
        onDuplicate: editor.handleDuplicateSelected,
        onToggleCollapsed: () =>
          editor.handleToggleCollapsed(editor.selectedNode.id),
        selectedNode: editor.selectedNode,
        top: selectedNodeMenuTop,
      },
      outlineDrawer: {
        canCollapseAll: editor.canCollapseAll,
        canExpandAll: editor.canExpandAll,
        hasActiveSelection: editor.hasActiveSelection,
        isOpen: editor.isOutlineOpen,
        mindMap: editor.mindMap,
        onCollapseAll: editor.handleCollapseAll,
        onExpandAll: editor.handleExpandAll,
        onSearchQueryChange: editor.setSearchQuery,
        onSelectNode: (nodeId: string) =>
          editor.selectNode(nodeId, { center: true, closeOutline: true }),
        outlineSearchVisibleSet,
        searchMatchIds,
        searchMatchesCount,
        searchQuery: editor.editorState.searchQuery,
        selectedNodeId: editor.selectedNodeId,
        totalNodes,
      },
    }),
    [
      camera,
      draggingState.dragging,
      draggingState.startDragging,
      editor,
      nodeFocusStates,
      onNodeImageView,
      outlineSearchVisibleSet,
      panning,
      previewConnector,
      reparentingState.reparenting,
      reparentingState.startReparenting,
      searchMatchIds,
      searchMatchesCount,
      selectedNodeMenuLeft,
      selectedNodeMenuTop,
      stagePositions,
      startPanning,
      totalNodes,
      visibleConnectors,
      visibleNodeIdSet,
      visibleNodeIds,
    ],
  );
}
