import { useCallback, useRef } from "react";
import { useCanvasState } from "../hooks/useCanvasState";
import { useMindMapEditor } from "../hooks/useMindMapEditor";
import { useEditorGraphViewModel } from "./internal/useEditorGraphViewModel";
import {
  useEditorStartupScreenModel,
} from "./internal/useEditorStartupScreenModel";
import {
  useEditorWorkspaceCommands,
} from "./internal/useEditorWorkspaceCommands";

export function useMindMapAppModel() {
  const centerOnNodeRef = useRef<(nodeId: string) => boolean>(() => false);
  const centerOnNode = useCallback((nodeId: string) => {
    return centerOnNodeRef.current(nodeId);
  }, []);

  const editor = useMindMapEditor({
    centerOnNode,
  });

  const canvasState = useCanvasState({ rootId: editor.mindMap.rootId });
  centerOnNodeRef.current = canvasState.centerOnNode;

  const startupScreen = useEditorStartupScreenModel(editor);
  const workspaceGraph = useEditorGraphViewModel({
    camera: canvasState.camera,
    editor,
    latestDocumentRef: canvasState.latestDocumentRef,
    panning: canvasState.panning,
    setCamera: canvasState.setCamera,
    startPanning: canvasState.startPanning,
    viewportSize: canvasState.viewportSize,
  });
  const workspaceCommands = useEditorWorkspaceCommands({
    cameraScale: canvasState.camera.scale,
    canvasCommands: {
      centerOnNode: canvasState.centerOnNode,
      fitToBounds: canvasState.fitToBounds,
      handleViewportWheel: canvasState.handleViewportWheel,
      viewportRef: canvasState.viewportRef,
      zoomIn: canvasState.zoomIn,
      zoomOut: canvasState.zoomOut,
    },
    editor,
    visibleWorldBounds: workspaceGraph.visibleWorldBounds,
  });

  if (startupScreen) {
    return {
      startupScreen,
      workspace: null,
    };
  }

  return {
    startupScreen: null,
    workspace: {
      ...workspaceCommands,
      ...workspaceGraph,
    },
  };
}
