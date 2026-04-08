import type { ReturnTypeUseMindMapEditor } from "./useEditorWorkspaceCommands";

type EditorModel = ReturnTypeUseMindMapEditor;

export function useEditorStartupScreenModel(editor: EditorModel) {
  if (!editor.fileState.isStartupScreenVisible) {
    return null;
  }

  return {
    canGenerateWithAi: editor.aiGenerationEnabled,
    onCreateAiMindMap: editor.openAiDialog,
    isFileActionPending: editor.fileState.isPending,
    lastFileActionError: editor.fileState.lastError,
    onCreateMindMap: editor.handleCreateNewMindMap,
    onDiscardStoredDraft: editor.handleDiscardStoredDraft,
    onOpenFile: () => {
      void editor.handleOpenFile();
    },
    onOpenRecentFile: (path: string) => {
      void editor.handleOpenRecentFile(path);
    },
    onRecoverStoredDraft: editor.handleRecoverStoredDraft,
    recentFiles: editor.fileState.recentFiles,
    recoverableDraft: editor.fileState.recoverableDraft,
  };
}
