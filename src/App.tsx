import {
  useCallback,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import "./App.css";
import appStyles from "./App.module.css";
import { getVisibleNodeIds } from "./mindmap";
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
  buildRenderPositions,
  buildSelectedDescendantSet,
  buildSelectedLineageSet,
  findSearchMatches,
} from "./features/editor/selectors";
import type { Position } from "./features/editor/types";
import { clamp } from "./features/editor/utils";
import { CanvasStage } from "./features/editor/components/CanvasStage";
import { CanvasBackgroundDialog } from "./features/editor/components/CanvasBackgroundDialog";
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
          x: position.x - canvasState.camera.x,
          y: position.y - canvasState.camera.y,
        },
      ]),
    ) as Record<string, Position>;
  }, [canvasState.camera.x, canvasState.camera.y, renderPositions]);

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
  const connectors = useMemo(
    () =>
      buildConnectors(
        editor.mindMap,
        editor.layoutType,
        visibleNodeIds,
        visibleNodeIdSet,
        stagePositions,
        nodeFocusStates,
      ),
    [
      editor.layoutType,
      editor.mindMap,
      nodeFocusStates,
      stagePositions,
      visibleNodeIdSet,
      visibleNodeIds,
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

      canvasState.setCamera({
        x:
          minimap.bounds.minX +
          (minimapX - minimap.offsetX) / minimap.scale -
          canvasWidth / 2,
        y:
          minimap.bounds.minY +
          (minimapY - minimap.offsetY) / minimap.scale -
          canvasHeight / 2,
      });
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
    handleOpenFile: editor.handleOpenFile,
    handleSaveFile: editor.handleSaveFile,
    hasActiveSelection: editor.hasActiveSelection,
    redo: editor.redo,
    selectedNodeId: editor.selectedNodeId,
    selectedNodeIsRoot: editor.selectedNode.parentId === null,
    undo: editor.undo,
  });

  const desktopMenuEnabled = useDesktopAppMenu({
    canRedo: editor.editorState.historyIndex < editor.editorState.history.length - 1,
    canUndo: editor.editorState.historyIndex > 0,
    currentFileName: editor.fileState.currentFileName,
    isFileActionPending: editor.fileState.isPending,
    isOutlineOpen: editor.isOutlineOpen,
    onAutoLayout: editor.handleAutoLayout,
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

  const totalNodes = Object.keys(editor.mindMap.nodes).length;
  const selectedNodePosition = stagePositions[editor.selectedNodeId];
  const selectedNodeMenuLeft =
    selectedNodePosition.x + NODE_WIDTH + NODE_CONTEXT_MENU_WIDTH + NODE_CONTEXT_MENU_GAP <
    canvasWidth - 24
      ? selectedNodePosition.x + NODE_WIDTH + NODE_CONTEXT_MENU_GAP
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
      <DocumentStatus
        currentFileName={editor.fileState.currentFileName}
        hasUnsavedFileChanges={editor.hasUnsavedFileChanges}
        isFileActionPending={editor.fileState.isPending}
        lastFileActionError={editor.fileState.lastError}
        onOpenBackgroundDialog={editor.openBackgroundDialog}
        onOpenLayoutDialog={editor.openLayoutDialog}
        showCanvasActions={!desktopMenuEnabled}
      />

      <CanvasStage
        backgroundPresetId={editor.backgroundPresetId}
        camera={canvasState.camera}
        connectors={connectors}
        draggingNodeId={draggingState.dragging?.nodeId ?? null}
        hasActiveSelection={editor.hasActiveSelection}
        layoutType={editor.layoutType}
        mindMap={editor.mindMap}
        nodeFocusStates={nodeFocusStates}
        onCanvasClick={editor.clearSelection}
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
        isOpen={editor.isInspectorOpen && editor.hasActiveSelection}
        onNodeColorChange={(color) =>
          editor.handleNodeColorChange(editor.selectedNode.id, color)
        }
        onNodeNotesChange={(value) =>
          editor.handleNodeNotesChange(editor.selectedNode.id, value)
        }
        onNodeTitleChange={(value) =>
          editor.handleNodeTitleChange(editor.selectedNode.id, value)
        }
        selectedNode={editor.selectedNode}
      />

      {!editor.isInspectorOpen ? (
        <MindMapMinimap
          minimap={minimap}
          minimapRef={minimapRef}
          onPointerDown={handleMinimapPointerDown}
        />
      ) : null}

      <MindMapTypeDialog
        currentLayoutType={editor.layoutType}
        isOpen={editor.isLayoutDialogOpen}
        onApply={editor.handleLayoutTypeChange}
        onClose={editor.closeLayoutDialog}
      />

      <CanvasBackgroundDialog
        currentBackgroundPresetId={editor.backgroundPresetId}
        isOpen={editor.isBackgroundDialogOpen}
        onApply={editor.handleBackgroundPresetChange}
        onClose={editor.closeBackgroundDialog}
      />
    </div>
  );
}

export default App;
