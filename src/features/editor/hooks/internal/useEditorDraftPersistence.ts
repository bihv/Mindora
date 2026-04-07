import { useEffect, useMemo } from "react";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import type {
  MindMapDocument,
  StoredMindMapDraft,
} from "../../../../domain/mindmap/model";
import {
  clearStoredMindMapDraft,
  saveMindMapDraft,
} from "../../../../platform/files/draftStore";
import type { EditorFileState } from "../../types";

type UseEditorDraftPersistenceArgs = {
  currentSnapshot: string;
  fileState: EditorFileState;
  hasStoredDraftForCurrentSessionRef: MutableRefObject<boolean>;
  mindMap: MindMapDocument;
  setFileState: Dispatch<SetStateAction<EditorFileState>>;
};

export function useEditorDraftPersistence({
  currentSnapshot,
  fileState,
  hasStoredDraftForCurrentSessionRef,
  mindMap,
  setFileState,
}: UseEditorDraftPersistenceArgs) {
  useEffect(() => {
    if (
      fileState.isStartupScreenVisible ||
      fileState.isPending ||
      fileState.draftBaselineSnapshot === null
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (currentSnapshot === fileState.draftBaselineSnapshot) {
        if (!hasStoredDraftForCurrentSessionRef.current) {
          return;
        }

        clearStoredMindMapDraft();
        hasStoredDraftForCurrentSessionRef.current = false;
        setFileState((current) =>
          current.recoverableDraft === null
            ? current
            : {
                ...current,
                recoverableDraft: null,
              },
        );
        return;
      }

      const nextRecoverableDraft: StoredMindMapDraft = {
        document: mindMap,
        draftBaselineSnapshot: fileState.draftBaselineSnapshot,
        fileHandlePath:
          typeof fileState.currentFileHandle === "string"
            ? fileState.currentFileHandle
            : null,
        fileName: fileState.currentFileName,
        lastSavedSnapshot: fileState.lastSavedSnapshot,
        updatedAt: Date.now(),
      };

      saveMindMapDraft(nextRecoverableDraft);
      hasStoredDraftForCurrentSessionRef.current = true;
      setFileState((current) => ({
        ...current,
        recoverableDraft: nextRecoverableDraft,
      }));
    }, 750);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    currentSnapshot,
    fileState.currentFileHandle,
    fileState.currentFileName,
    fileState.draftBaselineSnapshot,
    fileState.isPending,
    fileState.isStartupScreenVisible,
    fileState.lastSavedSnapshot,
    hasStoredDraftForCurrentSessionRef,
    mindMap,
    setFileState,
  ]);

  return useMemo(() => {
    if (fileState.lastSavedSnapshot === null) {
      return false;
    }

    return currentSnapshot !== fileState.lastSavedSnapshot;
  }, [currentSnapshot, fileState.lastSavedSnapshot]);
}
