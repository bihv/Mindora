import type { CameraState, Position } from "../../types";
import type { ReturnTypeUseMindMapEditor } from "./useEditorWorkspaceCommands";
import { useEditorGraphDerivedState } from "./graph/useEditorGraphDerivedState";
import { useEditorMinimapAndPreview } from "./graph/useEditorMinimapAndPreview";
import { useEditorWorkspacePanels } from "./graph/useEditorWorkspacePanels";

type UseEditorGraphViewModelArgs = {
  camera: CameraState;
  editor: ReturnTypeUseMindMapEditor;
  latestDocumentRef: React.MutableRefObject<
    import("../../../../domain/mindmap/model").MindMapDocument | null
  >;
  panning: { cameraOrigin: CameraState; pointerOrigin: Position } | null;
  setCamera: React.Dispatch<React.SetStateAction<CameraState>>;
  startPanning: (
    event: React.PointerEvent<HTMLDivElement>,
    onBeforePan?: () => void,
  ) => void;
  viewportSize: { width: number; height: number };
};

export function useEditorGraphViewModel({
  camera,
  editor,
  latestDocumentRef,
  panning,
  setCamera,
  startPanning,
  viewportSize,
}: UseEditorGraphViewModelArgs) {
  const derived = useEditorGraphDerivedState({
    camera,
    editor,
    latestDocumentRef,
    viewportSize,
  });

  const preview = useEditorMinimapAndPreview({
    camera,
    canvasHeight: derived.canvasHeight,
    canvasWidth: derived.canvasWidth,
    editor,
    nodeFocusStates: derived.nodeFocusStates,
    renderPositions: derived.renderPositions,
    setCamera,
    visibleNodeIdSet: derived.visibleNodeIdSet,
    visibleNodeIds: derived.visibleNodeIds,
  });

  const panels = useEditorWorkspacePanels({
    camera,
    canvasHeight: derived.canvasHeight,
    canvasWidth: derived.canvasWidth,
    draggingState: derived.draggingState,
    editor,
    nodeFocusStates: derived.nodeFocusStates,
    onNodeImageView: preview.onNodeImageView,
    outlineSearchVisibleSet: derived.outlineSearchVisibleSet,
    panning,
    previewConnector: derived.previewConnector,
    reparentingState: derived.reparentingState,
    searchMatchIds: derived.searchMatchIds,
    searchMatchesCount: derived.searchMatches.length,
    stagePositions: derived.stagePositions,
    startPanning,
    visibleConnectors: derived.visibleConnectors,
    visibleNodeIdSet: derived.visibleNodeIdSet,
    visibleNodeIds: derived.visibleNodeIds,
  });

  return {
    ...panels,
    lightbox: preview.lightbox,
    minimap: preview.minimap,
    visibleWorldBounds: derived.visibleWorldBounds,
  };
}
