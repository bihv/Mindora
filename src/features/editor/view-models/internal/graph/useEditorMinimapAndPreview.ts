import { useMemo } from "react";
import type { CameraState, Position } from "../../../types";
import { useImagePreview } from "../../../hooks/useImagePreview";
import { useMinimapNavigation } from "../../../hooks/useMinimapNavigation";
import { buildMinimapData } from "../../../selectors/minimap";
import type { ReturnTypeUseMindMapEditor } from "../useEditorWorkspaceCommands";

type UseEditorMinimapAndPreviewArgs = {
  camera: CameraState;
  canvasHeight: number;
  canvasWidth: number;
  editor: ReturnTypeUseMindMapEditor;
  nodeFocusStates: Record<
    string,
    import("../../../types").NodeFocusState
  >;
  renderPositions: Record<string, Position>;
  setCamera: React.Dispatch<React.SetStateAction<CameraState>>;
  visibleNodeIdSet: Set<string>;
  visibleNodeIds: string[];
};

export function useEditorMinimapAndPreview({
  camera,
  canvasHeight,
  canvasWidth,
  editor,
  nodeFocusStates,
  renderPositions,
  setCamera,
  visibleNodeIdSet,
  visibleNodeIds,
}: UseEditorMinimapAndPreviewArgs) {
  const minimap = useMemo(
    () =>
      buildMinimapData({
        camera,
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
      camera,
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

  const imagePreview = useImagePreview({
    mindMap: editor.mindMap,
    selectNode: editor.selectNode,
  });
  const minimapNavigation = useMinimapNavigation({
    canvasHeight,
    canvasWidth,
    closeNodeMenu: editor.closeNodeMenu,
    minimap,
    setCamera,
  });

  return {
    lightbox: {
      close: imagePreview.closeImagePreview,
      open: Boolean(imagePreview.imagePreviewUrl),
      slides: imagePreview.imagePreviewSlides,
    },
    minimap:
      !editor.isInspectorOpen &&
      !editor.isLayoutDialogOpen &&
      !editor.isBackgroundDialogOpen
        ? {
            minimap,
            minimapRef: minimapNavigation.minimapRef,
            onPointerDown: minimapNavigation.handleMinimapPointerDown,
          }
        : null,
    onNodeImageView: imagePreview.handleNodeImageView,
  };
}
