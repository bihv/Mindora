import { useCallback } from "react";
import { useDesktopAppMenu } from "../../hooks/useDesktopAppMenu";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useWindowTitle } from "../../hooks/useWindowTitle";

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null;

type CanvasCommands = {
  centerOnNode: (nodeId: string) => boolean;
  fitToBounds: (bounds: NonNullable<Bounds>, padding?: number) => boolean;
  handleViewportWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  viewportRef: React.RefCallback<HTMLDivElement>;
  zoomIn: () => boolean;
  zoomOut: () => boolean;
};

export type ReturnTypeUseMindMapEditor = ReturnType<
  typeof import("../../hooks/useMindMapEditor").useMindMapEditor
>;

type UseEditorWorkspaceCommandsArgs = {
  cameraScale: number;
  canvasCommands: CanvasCommands;
  editor: ReturnTypeUseMindMapEditor;
  visibleWorldBounds: Bounds;
};

export function useEditorWorkspaceCommands({
  cameraScale,
  canvasCommands,
  editor,
  visibleWorldBounds,
}: UseEditorWorkspaceCommandsArgs) {
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
    canGenerateWithAi: editor.aiGenerationEnabled,
    canDuplicateNode:
      editor.hasActiveSelection && editor.selectedNode.parentId !== null,
    canRedo:
      editor.editorState.historyIndex < editor.editorState.history.length - 1,
    canUndo: editor.editorState.historyIndex > 0,
    currentFileName: editor.fileState.currentFileName,
    isFileActionPending: editor.fileState.isPending,
    isOutlineOpen: editor.isOutlineOpen,
    onAutoLayout: editor.handleAutoLayout,
    onDuplicateNode: editor.handleDuplicateSelected,
    onExportFile: editor.handleExportFile,
    onNewAiMindMap: editor.openAiDialog,
    onOpenBackgroundDialog: editor.openBackgroundDialog,
    onOpenLayoutDialog: editor.openLayoutDialog,
    onNewMindMap: editor.handleCreateNewMindMap,
    onOpenFile: editor.handleOpenFile,
    onRedo: editor.redo,
    onSaveFile: editor.handleSaveFile,
    onToggleOutline: editor.toggleOutline,
    onUndo: editor.undo,
  });

  useWindowTitle({
    currentDocumentTitle: editor.mindMap.title,
    currentFileName: editor.fileState.currentFileName,
    hasUnsavedFileChanges: editor.hasUnsavedFileChanges,
    isFileActionPending: editor.fileState.isPending,
    lastFileActionError: editor.fileState.lastError,
  });

  const handleFitMap = useCallback(() => {
    if (!visibleWorldBounds) {
      return;
    }

    canvasCommands.fitToBounds(visibleWorldBounds);
  }, [canvasCommands, visibleWorldBounds]);

  const handleCenterSelectedNode = useCallback(() => {
    if (!editor.mindMap.nodes[editor.selectedNodeId]) {
      return;
    }

    canvasCommands.centerOnNode(editor.selectedNodeId);
  }, [canvasCommands, editor.mindMap.nodes, editor.selectedNodeId]);

  return {
    documentStatus:
      editor.fileState.lastError !== null
        ? {
            currentFileName: editor.fileState.currentFileName,
            hasUnsavedFileChanges: editor.hasUnsavedFileChanges,
            isFileActionPending: editor.fileState.isPending,
            lastFileActionError: editor.fileState.lastError,
            onOpenBackgroundDialog: editor.openBackgroundDialog,
            onOpenLayoutDialog: editor.openLayoutDialog,
          }
        : null,
    viewport: {
      onWheel: canvasCommands.handleViewportWheel,
      ref: canvasCommands.viewportRef,
    },
    viewportControls: {
      canCenterSelected: Boolean(editor.mindMap.nodes[editor.selectedNodeId]),
      onGenerateAiMap: editor.aiGenerationEnabled ? editor.openAiDialog : undefined,
      onCenterSelected: handleCenterSelectedNode,
      onFitMap: handleFitMap,
      onZoomIn: canvasCommands.zoomIn,
      onZoomOut: canvasCommands.zoomOut,
      zoomPercentage: Math.round(cameraScale * 100),
    },
  };
}
