import {
  useCallback,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import "./App.css";
import appStyles from "./App.module.css";
import { getNodeHeightForLayout, getVisibleNodeIds } from "./mindmap";
import {
  MINIMAP_HEIGHT,
  MINIMAP_WIDTH,
  MIN_CANVAS_HEIGHT,
  MIN_CANVAS_WIDTH,
  NODE_CONTEXT_MENU_GAP,
  NODE_CONTEXT_MENU_WIDTH,
  NODE_WIDTH,
} from "./features/editor/constants";
import {
  buildConnectors,
  buildMinimapData,
  buildNodeFocusStates,
  buildOutlineSearchVisibleSet,
  buildReparentPreviewConnector,
  buildRenderPositions,
  buildSelectedDescendantSet,
  buildSelectedLineageSet,
  findSearchMatches,
} from "./features/editor/selectors";
import type { Position } from "./features/editor/types";
import { clamp } from "./features/editor/utils";
import { CanvasStage } from "./features/editor/components/CanvasStage";
import { CanvasBackgroundDialog } from "./features/editor/components/CanvasBackgroundDialog";
import { CanvasViewportControls } from "./features/editor/components/CanvasViewportControls";
import { DocumentStatus } from "./features/editor/components/DocumentStatus";
import { InspectorDrawer } from "./features/editor/components/InspectorDrawer";
import { MindMapTypeDialog } from "./features/editor/components/MindMapTypeDialog";
import { MindMapMinimap } from "./features/editor/components/MindMapMinimap";
import { NodeContextMenu } from "./features/editor/components/NodeContextMenu";
import { OutlineDrawer } from "./features/editor/components/OutlineDrawer";
import { RecentFilesLauncher } from "./features/editor/components/RecentFilesLauncher";
import { useCanvasState } from "./features/editor/hooks/useCanvasState";
import { useDesktopAppMenu } from "./features/editor/hooks/useDesktopAppMenu";
import { useKeyboardShortcuts } from "./features/editor/hooks/useKeyboardShortcuts";
import { useMindMapEditor } from "./features/editor/hooks/useMindMapEditor";
import { useNodeDragging } from "./features/editor/hooks/useNodeDragging";
import { useNodeReparenting } from "./features/editor/hooks/useNodeReparenting";
import { useWindowTitle } from "./features/editor/hooks/useWindowTitle";

function App() {
  const centerOnNodeRef = useRef<(nodeId: string) => boolean>(() => false);
  const centerOnNode = useCallback((nodeId: string) => {
    return centerOnNodeRef.current(nodeId);
  }, []);

  const editor = useMindMapEditor({
    centerOnNode,
  });

  const canvasState = useCanvasState({ rootId: editor.mindMap.rootId });
  centerOnNodeRef.current = canvasState.centerOnNode;

  canvasState.latestDocumentRef.current = editor.mindMap;

  const minimapRef = useRef<SVGSVGElement | null>(null);
  const canvasWidth = Math.max(
    canvasState.viewportSize.width,
    MIN_CANVAS_WIDTH,
  );
  const canvasHeight = Math.max(
    canvasState.viewportSize.height,
    MIN_CANVAS_HEIGHT,
  );

  const draggingState = useNodeDragging({
    commitDocument: editor.commitDocument,
    latestDocumentRef: canvasState.latestDocumentRef,
    mindMap: editor.mindMap,
    selectNode: editor.selectNode,
    viewportScale: canvasState.camera.scale,
  });
  const reparentingState = useNodeReparenting({
    handleReparentNode: editor.handleReparentNode,
    mindMap: editor.mindMap,
    selectNode: editor.selectNode,
  });

  const renderPositions = useMemo(
    () => buildRenderPositions(editor.mindMap, draggingState.dragging),
    [draggingState.dragging, editor.mindMap],
  );
  const stagePositions = useMemo(() => {
    return Object.fromEntries(
      Object.entries(renderPositions).map(([nodeId, position]) => [
        nodeId,
        {
          x: (position.x - canvasState.camera.x) * canvasState.camera.scale,
          y: (position.y - canvasState.camera.y) * canvasState.camera.scale,
        },
      ]),
    ) as Record<string, Position>;
  }, [
    canvasState.camera.scale,
    canvasState.camera.x,
    canvasState.camera.y,
    renderPositions,
  ]);

  const visibleNodeIds = useMemo(
    () => getVisibleNodeIds(editor.mindMap),
    [editor.mindMap],
  );
  const visibleNodeIdSet = useMemo(
    () => new Set(visibleNodeIds),
    [visibleNodeIds],
  );
  const selectedLineageSet = useMemo(
    () =>
      buildSelectedLineageSet(
        editor.mindMap,
        editor.selectedNodeId,
        editor.hasActiveSelection,
      ),
    [editor.hasActiveSelection, editor.mindMap, editor.selectedNodeId],
  );
  const selectedDescendantSet = useMemo(
    () =>
      buildSelectedDescendantSet(
        editor.mindMap,
        editor.selectedNodeId,
        editor.hasActiveSelection,
      ),
    [editor.hasActiveSelection, editor.mindMap, editor.selectedNodeId],
  );
  const nodeFocusStates = useMemo(
    () =>
      buildNodeFocusStates(
        visibleNodeIds,
        editor.hasActiveSelection,
        editor.selectedNodeId,
        selectedLineageSet,
        selectedDescendantSet,
      ),
    [
      editor.hasActiveSelection,
      editor.selectedNodeId,
      selectedDescendantSet,
      selectedLineageSet,
      visibleNodeIds,
    ],
  );
  const searchMatches = useMemo(
    () => findSearchMatches(editor.mindMap, editor.editorState.searchQuery),
    [editor.editorState.searchQuery, editor.mindMap],
  );
  const searchMatchIds = useMemo(
    () => new Set(searchMatches.map((node) => node.id)),
    [searchMatches],
  );
  const outlineSearchVisibleSet = useMemo(
    () =>
      buildOutlineSearchVisibleSet(
        editor.mindMap,
        editor.editorState.searchQuery,
      ),
    [editor.editorState.searchQuery, editor.mindMap],
  );
  const visibleWorldBounds = useMemo(() => {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const nodeId of visibleNodeIds) {
      const node = editor.mindMap.nodes[nodeId];
      const position = renderPositions[nodeId];

      if (!node || !position) {
        continue;
      }

      const nodeHeight = getNodeHeightForLayout(editor.layoutType, node);
      minX = Math.min(minX, position.x);
      minY = Math.min(minY, position.y);
      maxX = Math.max(maxX, position.x + NODE_WIDTH);
      maxY = Math.max(maxY, position.y + nodeHeight);
    }

    if (
      !Number.isFinite(minX) ||
      !Number.isFinite(minY) ||
      !Number.isFinite(maxX) ||
      !Number.isFinite(maxY)
    ) {
      return null;
    }

    return { minX, minY, maxX, maxY };
  }, [editor.layoutType, editor.mindMap, renderPositions, visibleNodeIds]);
  const connectors = useMemo(
    () =>
      buildConnectors(
        editor.mindMap,
        editor.layoutType,
        visibleNodeIds,
        visibleNodeIdSet,
        stagePositions,
        canvasState.camera.scale,
        nodeFocusStates,
      ),
    [
      canvasState.camera.scale,
      editor.layoutType,
      editor.mindMap,
      nodeFocusStates,
      stagePositions,
      visibleNodeIdSet,
      visibleNodeIds,
    ],
  );
  const visibleConnectors = useMemo(() => {
    if (!reparentingState.reparenting) {
      return connectors;
    }

    return connectors.filter(
      (connector) => connector.id !== reparentingState.reparenting?.nodeId,
    );
  }, [connectors, reparentingState.reparenting]);
  const previewConnector = useMemo(
    () =>
      buildReparentPreviewConnector(
        editor.mindMap,
        editor.layoutType,
        stagePositions,
        canvasState.camera.scale,
        reparentingState.reparenting,
      ),
    [
      canvasState.camera.scale,
      editor.layoutType,
      editor.mindMap,
      reparentingState.reparenting,
      stagePositions,
    ],
  );
  const minimap = useMemo(
    () =>
      buildMinimapData({
        camera: canvasState.camera,
        canvasHeight,
        canvasWidth,
        document: editor.mindMap,
        hasActiveSelection: editor.hasActiveSelection,
        nodeFocusStates,
        renderPositions,
        selectedNodeId: editor.selectedNodeId,
        visibleNodeIdSet,
        visibleNodeIds,
      }),
    [
      canvasState.camera,
      canvasHeight,
      canvasWidth,
      editor.hasActiveSelection,
      editor.mindMap,
      editor.selectedNodeId,
      nodeFocusStates,
      renderPositions,
      visibleNodeIdSet,
      visibleNodeIds,
    ],
  );

  const updateCameraFromMinimapPoint = useCallback(
    (clientX: number, clientY: number) => {
      const minimapElement = minimapRef.current;
      if (!minimapElement || minimap.scale <= 0) {
        return;
      }

      const rect = minimapElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      const localX = clamp(
        ((clientX - rect.left) / rect.width) * MINIMAP_WIDTH,
        0,
        MINIMAP_WIDTH,
      );
      const localY = clamp(
        ((clientY - rect.top) / rect.height) * MINIMAP_HEIGHT,
        0,
        MINIMAP_HEIGHT,
      );
      const minimapX = clamp(
        localX,
        minimap.offsetX,
        minimap.offsetX + minimap.contentWidth,
      );
      const minimapY = clamp(
        localY,
        minimap.offsetY,
        minimap.offsetY + minimap.contentHeight,
      );

      canvasState.setCamera((current) => ({
        ...current,
        x:
          minimap.bounds.minX +
          (minimapX - minimap.offsetX) / minimap.scale -
          canvasWidth / (2 * current.scale),
        y:
          minimap.bounds.minY +
          (minimapY - minimap.offsetY) / minimap.scale -
          canvasHeight / (2 * current.scale),
      }));
    },
    [canvasHeight, canvasState, canvasWidth, minimap],
  );

  const handleMinimapPointerDown = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      event.preventDefault();
      event.stopPropagation();
      editor.closeNodeMenu();
      updateCameraFromMinimapPoint(event.clientX, event.clientY);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        updateCameraFromMinimapPoint(moveEvent.clientX, moveEvent.clientY);
      };

      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [editor, updateCameraFromMinimapPoint],
  );

  useKeyboardShortcuts({
    clearSelection: editor.clearSelection,
    closeOutline: () => editor.setIsOutlineOpen(false),
    handleAddChild: editor.handleAddChild,
    handleAddSibling: editor.handleAddSibling,
    handleDeleteSelected: editor.handleDeleteSelected,
    handleDuplicateSelected: editor.handleDuplicateSelected,
    handleOpenFile: editor.handleOpenFile,
    handleSaveFile: editor.handleSaveFile,
    hasActiveSelection: editor.hasActiveSelection,
    redo: editor.redo,
    selectedNodeId: editor.selectedNodeId,
    selectedNodeIsRoot: editor.selectedNode.parentId === null,
    undo: editor.undo,
  });

  useDesktopAppMenu({
    canDuplicateNode:
      editor.hasActiveSelection && editor.selectedNode.parentId !== null,
    canRedo: editor.editorState.historyIndex < editor.editorState.history.length - 1,
    canUndo: editor.editorState.historyIndex > 0,
    currentFileName: editor.fileState.currentFileName,
    isFileActionPending: editor.fileState.isPending,
    isOutlineOpen: editor.isOutlineOpen,
    onAutoLayout: editor.handleAutoLayout,
    onDuplicateNode: editor.handleDuplicateSelected,
    onExportFile: editor.handleExportFile,
    onOpenBackgroundDialog: editor.openBackgroundDialog,
    onOpenLayoutDialog: editor.openLayoutDialog,
    onNewMindMap: editor.handleCreateNewMindMap,
    onOpenFile: editor.handleOpenFile,
    onRedo: editor.redo,
    onSaveFile: editor.handleSaveFile,
    onToggleOutline: editor.toggleOutline,
    onUndo: editor.undo,
  });
  const shouldShowDocumentStatus = editor.fileState.lastError !== null;
  const handleFitMap = useCallback(() => {
    if (!visibleWorldBounds) {
      return;
    }

    canvasState.fitToBounds(visibleWorldBounds);
  }, [canvasState.fitToBounds, visibleWorldBounds]);
  const handleCenterSelectedNode = useCallback(() => {
    if (!editor.hasActiveSelection) {
      return;
    }

    canvasState.centerOnNode(editor.selectedNodeId);
  }, [
    canvasState.centerOnNode,
    editor.hasActiveSelection,
    editor.selectedNodeId,
  ]);

  useWindowTitle({
    currentDocumentTitle: editor.mindMap.title,
    currentFileName: editor.fileState.currentFileName,
    hasUnsavedFileChanges: editor.hasUnsavedFileChanges,
    isFileActionPending: editor.fileState.isPending,
    lastFileActionError: editor.fileState.lastError,
  });

  const totalNodes = Object.keys(editor.mindMap.nodes).length;
  const selectedNodePosition = stagePositions[editor.selectedNodeId];
  const scaledNodeWidth = NODE_WIDTH * canvasState.camera.scale;
  const selectedNodeMenuLeft =
    selectedNodePosition.x +
      scaledNodeWidth +
      NODE_CONTEXT_MENU_WIDTH +
      NODE_CONTEXT_MENU_GAP <
    canvasWidth - 24
      ? selectedNodePosition.x + scaledNodeWidth + NODE_CONTEXT_MENU_GAP
      : Math.max(
          selectedNodePosition.x - NODE_CONTEXT_MENU_WIDTH - NODE_CONTEXT_MENU_GAP,
          24,
        );
  const selectedNodeMenuTop = clamp(selectedNodePosition.y, 24, canvasHeight - 24);

  if (editor.fileState.isStartupScreenVisible) {
    return (
      <RecentFilesLauncher
        isFileActionPending={editor.fileState.isPending}
        lastFileActionError={editor.fileState.lastError}
        onCreateMindMap={editor.handleCreateNewMindMap}
        onOpenFile={() => {
          void editor.handleOpenFile();
        }}
        onOpenRecentFile={(path) => {
          void editor.handleOpenRecentFile(path);
        }}
        recentFiles={editor.fileState.recentFiles}
      />
    );
  }

  return (
    <div
      className={appStyles.canvasViewport}
      onWheel={canvasState.handleViewportWheel}
      ref={canvasState.viewportRef}
    >
      {shouldShowDocumentStatus ? (
        <DocumentStatus
          currentFileName={editor.fileState.currentFileName}
          hasUnsavedFileChanges={editor.hasUnsavedFileChanges}
          isFileActionPending={editor.fileState.isPending}
          lastFileActionError={editor.fileState.lastError}
          onOpenBackgroundDialog={editor.openBackgroundDialog}
          onOpenLayoutDialog={editor.openLayoutDialog}
        />
      ) : null}

      <CanvasViewportControls
        canCenterSelected={editor.hasActiveSelection}
        onCenterSelected={handleCenterSelectedNode}
        onFitMap={handleFitMap}
        onZoomIn={canvasState.zoomIn}
        onZoomOut={canvasState.zoomOut}
        zoomPercentage={Math.round(canvasState.camera.scale * 100)}
      />

      <CanvasStage
        backgroundPresetId={editor.backgroundPresetId}
        camera={canvasState.camera}
        connectors={visibleConnectors}
        draggingNodeId={draggingState.dragging?.nodeId ?? null}
        hasActiveSelection={editor.hasActiveSelection}
        layoutType={editor.layoutType}
        mindMap={editor.mindMap}
        nodeFocusStates={nodeFocusStates}
        onCanvasClick={editor.clearSelection}
        onNodeConnectorPointerDown={reparentingState.startReparenting}
        onNodeContextMenu={(nodeId, event) => {
          event.preventDefault();
          event.stopPropagation();
          editor.selectNode(nodeId, {
            openMenu: true,
            showInspector: true,
          });
        }}
        onNodePointerDown={draggingState.startDragging}
        onNodeSelect={(nodeId) =>
          editor.selectNode(nodeId, {
            openMenu: false,
            showInspector: true,
          })
        }
        onToggleCollapsed={editor.handleToggleCollapsed}
        onStagePointerDown={(event) =>
          canvasState.startPanning(event, editor.clearSelection)
        }
        panning={canvasState.panning !== null}
        previewConnector={previewConnector}
        reparentTargetNodeId={reparentingState.reparenting?.candidateParentId ?? null}
        searchMatchIds={searchMatchIds}
        selectedNodeId={editor.selectedNodeId}
        stagePositions={stagePositions}
        visibleNodeIds={visibleNodeIds}
      >
        <NodeContextMenu
          isVisible={
            editor.hasActiveSelection &&
            editor.editorState.isNodeMenuOpen &&
            visibleNodeIdSet.has(editor.selectedNodeId)
          }
          left={selectedNodeMenuLeft}
          onAddChild={() => editor.handleAddChild(editor.selectedNode.id)}
          onAddSibling={() => editor.handleAddSibling(editor.selectedNode.id)}
          onDelete={editor.handleDeleteSelected}
          onDuplicate={editor.handleDuplicateSelected}
          onToggleCollapsed={() =>
            editor.handleToggleCollapsed(editor.selectedNode.id)
          }
          selectedNode={editor.selectedNode}
          top={selectedNodeMenuTop}
        />
      </CanvasStage>

      <OutlineDrawer
        hasActiveSelection={editor.hasActiveSelection}
        isOpen={editor.isOutlineOpen}
        mindMap={editor.mindMap}
        onSearchQueryChange={editor.setSearchQuery}
        onSelectNode={(nodeId) =>
          editor.selectNode(nodeId, { center: true, closeOutline: true })
        }
        outlineSearchVisibleSet={outlineSearchVisibleSet}
        searchMatchIds={searchMatchIds}
        searchMatchesCount={searchMatches.length}
        searchQuery={editor.editorState.searchQuery}
        selectedNodeId={editor.selectedNodeId}
        totalNodes={totalNodes}
      />

      <InspectorDrawer
        isOpen={
          editor.isInspectorOpen &&
          editor.hasActiveSelection &&
          !editor.isLayoutDialogOpen &&
          !editor.isBackgroundDialogOpen
        }
        onNodeColorChange={(color) =>
          editor.handleNodeColorChange(editor.selectedNode.id, color)
        }
        onNodeEmojiChange={(value) =>
          editor.handleNodeEmojiChange(editor.selectedNode.id, value)
        }
        onNodeImageUrlChange={(value) =>
          editor.handleNodeImageUrlChange(editor.selectedNode.id, value)
        }
        onNodeKindChange={(kind) =>
          editor.handleNodeKindChange(editor.selectedNode.id, kind)
        }
        onNodeLinkUrlChange={(value) =>
          editor.handleNodeLinkUrlChange(editor.selectedNode.id, value)
        }
        onNodeNotesChange={(value) =>
          editor.handleNodeNotesChange(editor.selectedNode.id, value)
        }
        onNodeTitleChange={(value) =>
          editor.handleNodeTitleChange(editor.selectedNode.id, value)
        }
        selectedNode={editor.selectedNode}
      />

      {!editor.isInspectorOpen &&
      !editor.isLayoutDialogOpen &&
      !editor.isBackgroundDialogOpen ? (
        <MindMapMinimap
          minimap={minimap}
          minimapRef={minimapRef}
          onPointerDown={handleMinimapPointerDown}
        />
      ) : null}

      <MindMapTypeDialog
        currentLayoutType={editor.layoutType}
        initialLayoutType={editor.layoutPanelInitialLayoutType}
        isOpen={editor.isLayoutDialogOpen}
        onReset={editor.resetLayoutDialog}
        onSelect={editor.handleLayoutTypeChange}
        onClose={editor.closeLayoutDialog}
      />

      <CanvasBackgroundDialog
        currentBackgroundPresetId={editor.backgroundPresetId}
        initialBackgroundPresetId={editor.backgroundPanelInitialPresetId}
        isOpen={editor.isBackgroundDialogOpen}
        onReset={editor.resetBackgroundDialog}
        onSelect={editor.handleBackgroundPresetChange}
        onClose={editor.closeBackgroundDialog}
      />
    </div>
  );
}

export default App;
