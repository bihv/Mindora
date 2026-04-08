import { useCallback, useMemo } from "react";
import {
  createBlankMindMap,
  getMindMapBackgroundPresetId,
  getMindMapLayoutType,
} from "../../../domain/mindmap/documents";
import type { MindMapDocument } from "../../../domain/mindmap/model";
import { serializeMindMapDocument } from "../../../platform/files/repository";
import { useEditorChromeState } from "./internal/useEditorChromeState";
import { useEditorDraftPersistence } from "./internal/useEditorDraftPersistence";
import { useAiMindMapGeneration } from "./internal/useAiMindMapGeneration";
import { useEditorFileSession } from "./internal/useEditorFileSession";
import { useEditorHistoryState } from "./internal/useEditorHistoryState";
import { useEditorNodeActions } from "./internal/useEditorNodeActions";

type UseMindMapEditorArgs = {
  centerOnNode: (nodeId: string) => boolean;
};

function createDefaultMindMapDocument(): MindMapDocument {
  return createBlankMindMap("Focus Map");
}

export function useMindMapEditor({ centerOnNode }: UseMindMapEditorArgs) {
  const chrome = useEditorChromeState();
  const history = useEditorHistoryState({
    centerOnNode,
    createInitialDocument: createDefaultMindMapDocument,
    setIsInspectorOpen: chrome.setIsInspectorOpen,
    setIsOutlineOpen: chrome.setIsOutlineOpen,
  });

  const currentSnapshot = useMemo(
    () => serializeMindMapDocument(history.mindMap),
    [history.mindMap],
  );
  const backgroundPresetId = getMindMapBackgroundPresetId(history.mindMap);
  const layoutType = getMindMapLayoutType(history.mindMap);

  const nodeActions = useEditorNodeActions({
    backgroundPresetId,
    centerOnNode,
    closeNodeMenu: history.closeNodeMenu,
    commitDocument: history.commitDocument,
    hasActiveSelection: history.hasActiveSelection,
    layoutType,
    mindMap: history.mindMap,
    selectedNode: history.selectedNode,
    selectedNodeId: history.selectedNodeId,
    setIsInspectorOpen: chrome.setIsInspectorOpen,
  });

  const fileSession = useEditorFileSession({
    centerOnNode,
    currentDocument: history.mindMap,
    replaceEditorDocument: history.replaceEditorDocument,
    resetChromeState: chrome.resetChromeState,
  });
  const { handleBackgroundPresetChange, handleLayoutTypeChange } = nodeActions;

  const resetLayoutDialog = useCallback(() => {
    if (
      chrome.layoutPanelInitialLayoutType === null ||
      chrome.layoutPanelInitialLayoutType === layoutType
    ) {
      return;
    }

    handleLayoutTypeChange(chrome.layoutPanelInitialLayoutType);
  }, [
    chrome.layoutPanelInitialLayoutType,
    handleLayoutTypeChange,
    layoutType,
  ]);

  const resetBackgroundDialog = useCallback(() => {
    if (
      chrome.backgroundPanelInitialPresetId === null ||
      chrome.backgroundPanelInitialPresetId === backgroundPresetId
    ) {
      return;
    }

    handleBackgroundPresetChange(chrome.backgroundPanelInitialPresetId);
  }, [
    backgroundPresetId,
    chrome.backgroundPanelInitialPresetId,
    handleBackgroundPresetChange,
  ]);

  const hasUnsavedFileChanges = useEditorDraftPersistence({
    currentSnapshot,
    fileState: fileSession.fileState,
    hasStoredDraftForCurrentSessionRef:
      fileSession.hasStoredDraftForCurrentSessionRef,
    mindMap: history.mindMap,
    setFileState: fileSession.setFileState,
  });

  const aiGeneration = useAiMindMapGeneration({
    currentDocument: history.mindMap,
    isStartupScreenVisible: fileSession.fileState.isStartupScreenVisible,
    layoutType,
    replaceWithNewDocument: fileSession.handleReplaceWithNewDocument,
  });

  const openLayoutDialog = useCallback(() => {
    chrome.openLayoutDialog(layoutType);
  }, [chrome, layoutType]);

  const openBackgroundDialog = useCallback(() => {
    chrome.openBackgroundDialog(backgroundPresetId);
  }, [backgroundPresetId, chrome]);

  const openAiDialog = useCallback(() => {
    chrome.closeBackgroundDialog();
    chrome.closeLayoutDialog();
    chrome.setIsInspectorOpen(false);
    aiGeneration.openDialog();
  }, [aiGeneration, chrome]);

  return useMemo(
    () => ({
      ...aiGeneration,
      ...chrome,
      ...fileSession,
      ...history,
      ...nodeActions,
      backgroundPresetId,
      hasUnsavedFileChanges,
      layoutType,
      openAiDialog,
      openBackgroundDialog,
      openLayoutDialog,
      resetBackgroundDialog,
      resetLayoutDialog,
    }),
    [
      aiGeneration,
      backgroundPresetId,
      chrome,
      fileSession,
      hasUnsavedFileChanges,
      history,
      layoutType,
      nodeActions,
      openAiDialog,
      openBackgroundDialog,
      openLayoutDialog,
      resetBackgroundDialog,
      resetLayoutDialog,
    ],
  );
}
