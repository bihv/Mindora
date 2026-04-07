import { useCallback, useMemo, useRef, useState } from "react";
import { createBlankMindMap } from "../../../../domain/mindmap/documents";
import type {
  MindMapDocument,
  StoredMindMapDraft,
} from "../../../../domain/mindmap/model";
import {
  clearStoredMindMapDraft,
  loadStoredMindMapDraft,
} from "../../../../platform/files/draftStore";
import { loadRecentMindMapFiles } from "../../../../platform/files/recentFilesStore";
import {
  openMindMapFile,
  openMindMapFileFromPath,
  saveMindMapExportFile,
  saveMindMapFile,
  serializeMindMapDocument,
} from "../../../../platform/files/repository";
import {
  buildMindMapExportBlob,
  EXPORT_FORMAT_LABELS,
  type ExportFormat,
} from "../../../export";
import type { EditorFileState } from "../../types";
import { getFileErrorMessage } from "./editorFileErrors";

type ReplaceDocumentOptions = {
  draftBaselineSnapshot?: string | null;
  fileHandle?: EditorFileState["currentFileHandle"];
  fileName?: string | null;
  lastSavedSnapshot?: string | null;
  markStoredDraftAsCurrentSession?: boolean;
  recentFiles?: EditorFileState["recentFiles"];
  recoverableDraft?: StoredMindMapDraft | null;
};

type UseEditorFileSessionArgs = {
  centerOnNode: (nodeId: string) => boolean;
  currentDocument: MindMapDocument;
  replaceEditorDocument: (document: MindMapDocument) => string;
  resetChromeState: () => void;
};

function createDefaultMindMapDocument(): MindMapDocument {
  return createBlankMindMap("Focus Map");
}

export function useEditorFileSession({
  centerOnNode,
  currentDocument,
  replaceEditorDocument,
  resetChromeState,
}: UseEditorFileSessionArgs) {
  const hasStoredDraftForCurrentSessionRef = useRef(false);
  const [fileState, setFileState] = useState<EditorFileState>({
    currentFileHandle: null,
    currentFileName: null,
    draftBaselineSnapshot: null,
    isPending: false,
    isStartupScreenVisible: true,
    lastError: null,
    lastSavedSnapshot: null,
    recentFiles: loadRecentMindMapFiles(),
    recoverableDraft: loadStoredMindMapDraft(),
  });

  const replaceDocument = useCallback(
    (document: MindMapDocument, options?: ReplaceDocumentOptions) => {
      const fallbackSnapshot = serializeMindMapDocument(document);
      const nextSelectedNodeId = replaceEditorDocument(document);
      hasStoredDraftForCurrentSessionRef.current =
        options?.markStoredDraftAsCurrentSession ?? false;

      setFileState((current) => ({
        ...current,
        currentFileHandle: options?.fileHandle ?? null,
        currentFileName: options?.fileName ?? null,
        draftBaselineSnapshot:
          options?.draftBaselineSnapshot ?? fallbackSnapshot,
        isPending: false,
        isStartupScreenVisible: false,
        lastError: null,
        lastSavedSnapshot: options?.lastSavedSnapshot ?? null,
        recentFiles: options?.recentFiles ?? current.recentFiles,
        recoverableDraft:
          options?.recoverableDraft === undefined
            ? current.recoverableDraft
            : options.recoverableDraft,
      }));
      resetChromeState();

      requestAnimationFrame(() => {
        centerOnNode(nextSelectedNodeId);
      });
    },
    [centerOnNode, replaceEditorDocument, resetChromeState],
  );

  const handleOpenFile = useCallback(async () => {
    setFileState((current) => ({
      ...current,
      isPending: true,
      lastError: null,
    }));

    try {
      const result = await openMindMapFile();
      if (!result) {
        setFileState((current) => ({
          ...current,
          isPending: false,
        }));
        return;
      }

      replaceDocument(result.document, {
        fileHandle: result.fileHandle,
        fileName: result.fileName,
        draftBaselineSnapshot: result.contents,
        lastSavedSnapshot: result.contents,
        recentFiles: loadRecentMindMapFiles(),
      });
    } catch (error) {
      setFileState((current) => ({
        ...current,
        isPending: false,
        lastError: getFileErrorMessage(error, "Unable to open the selected file."),
      }));
    }
  }, [replaceDocument]);

  const handleOpenRecentFile = useCallback(
    async (path: string) => {
      setFileState((current) => ({
        ...current,
        isPending: true,
        lastError: null,
      }));

      try {
        const result = await openMindMapFileFromPath(path);

        replaceDocument(result.document, {
          fileHandle: result.fileHandle,
          fileName: result.fileName,
          draftBaselineSnapshot: result.contents,
          lastSavedSnapshot: result.contents,
          recentFiles: loadRecentMindMapFiles(),
        });
      } catch (error) {
        setFileState((current) => ({
          ...current,
          isPending: false,
          lastError: getFileErrorMessage(error, "Unable to open the selected file."),
          recentFiles: loadRecentMindMapFiles(),
        }));
      }
    },
    [replaceDocument],
  );

  const handleCreateNewMindMap = useCallback(() => {
    replaceDocument(createDefaultMindMapDocument());
  }, [replaceDocument]);

  const handleRecoverStoredDraft = useCallback(() => {
    const recoverableDraft = fileState.recoverableDraft;
    if (!recoverableDraft) {
      return;
    }

    const fileHandlePath =
      typeof recoverableDraft.fileHandlePath === "string" &&
      recoverableDraft.fileHandlePath.trim()
        ? recoverableDraft.fileHandlePath
        : null;
    const isLegacyDraft = recoverableDraft.updatedAt === null;

    replaceDocument(recoverableDraft.document, {
      draftBaselineSnapshot:
        recoverableDraft.draftBaselineSnapshot ??
        serializeMindMapDocument(recoverableDraft.document),
      fileHandle: fileHandlePath,
      fileName: fileHandlePath ? recoverableDraft.fileName : null,
      lastSavedSnapshot: recoverableDraft.lastSavedSnapshot,
      markStoredDraftAsCurrentSession: !isLegacyDraft,
      recoverableDraft,
    });
  }, [fileState.recoverableDraft, replaceDocument]);

  const handleDiscardStoredDraft = useCallback(() => {
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
  }, []);

  const handleSaveFile = useCallback(async () => {
    setFileState((current) => ({
      ...current,
      isPending: true,
      lastError: null,
    }));

    try {
      const result = await saveMindMapFile({
        document: currentDocument,
        existingFileHandle: fileState.currentFileHandle,
      });
      if (!result) {
        setFileState((current) => ({
          ...current,
          isPending: false,
        }));
        return;
      }

      const shouldClearCurrentDraft = hasStoredDraftForCurrentSessionRef.current;
      if (shouldClearCurrentDraft) {
        clearStoredMindMapDraft();
      }
      hasStoredDraftForCurrentSessionRef.current = false;
      setFileState((current) => ({
        ...current,
        currentFileHandle: result.fileHandle,
        currentFileName: result.fileName,
        draftBaselineSnapshot: result.contents,
        isPending: false,
        isStartupScreenVisible: false,
        lastError: null,
        lastSavedSnapshot: result.contents,
        recentFiles: loadRecentMindMapFiles(),
        recoverableDraft: shouldClearCurrentDraft
          ? null
          : current.recoverableDraft,
      }));
    } catch (error) {
      setFileState((current) => ({
        ...current,
        isPending: false,
        lastError: getFileErrorMessage(error, "Unable to save the current map."),
      }));
    }
  }, [currentDocument, fileState.currentFileHandle]);

  const handleExportFile = useCallback(
    async (format: ExportFormat) => {
      setFileState((current) => ({
        ...current,
        isPending: true,
        lastError: null,
      }));

      try {
        const result = await saveMindMapExportFile({
          createContents: () => buildMindMapExportBlob(currentDocument, format),
          documentTitle: currentDocument.title,
          format,
        });

        setFileState((current) => ({
          ...current,
          isPending: false,
          lastError: null,
        }));

        if (!result) {
          return;
        }
      } catch (error) {
        setFileState((current) => ({
          ...current,
          isPending: false,
          lastError: getFileErrorMessage(
            error,
            `Unable to export the current map as ${EXPORT_FORMAT_LABELS[format]}.`,
          ),
        }));
      }
    },
    [currentDocument],
  );

  return useMemo(
    () => ({
      fileState,
      handleCreateNewMindMap,
      handleDiscardStoredDraft,
      handleExportFile,
      handleOpenFile,
      handleOpenRecentFile,
      handleRecoverStoredDraft,
      handleSaveFile,
      hasStoredDraftForCurrentSessionRef,
      replaceDocument,
      setFileState,
    }),
    [
      fileState,
      handleCreateNewMindMap,
      handleDiscardStoredDraft,
      handleExportFile,
      handleOpenFile,
      handleOpenRecentFile,
      handleRecoverStoredDraft,
      handleSaveFile,
      replaceDocument,
    ],
  );
}
