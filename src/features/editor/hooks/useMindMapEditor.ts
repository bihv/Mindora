import { useCallback, useMemo, useState } from "react";
import {
  cloneMindMapDocument,
  createBlankMindMap,
  createChildNode,
  createSiblingNode,
  deleteNode,
  resolveSelectedNodeId,
  updateNodePosition,
  type MindMapDocument,
  type NodeColor,
} from "../../../mindmap";
import { HISTORY_LIMIT } from "../constants";
import {
  saveMindMapExportFile,
  loadRecentMindMapFiles,
  openMindMapFile,
  openMindMapFileFromPath,
  saveMindMapFile,
  serializeMindMapDocument,
} from "../filePersistence";
import { buildMindMapExportBlob } from "../export";
import { buildAutoLayoutPositions } from "../layout";
import { EXPORT_FORMAT_LABELS, type ExportFormat } from "../exportTypes";
import type {
  EditorFileState,
  EditorState,
  SelectNodeOptions,
} from "../types";

type UseMindMapEditorArgs = {
  centerOnNode: (nodeId: string) => boolean;
};

export function useMindMapEditor({ centerOnNode }: UseMindMapEditorArgs) {
  const [editorState, setEditorState] = useState<EditorState>(() => {
    const initialDocument = createBlankMindMap("Focus Map");

    return {
      history: [initialDocument],
      historyIndex: 0,
      selectedNodeId: initialDocument.rootId,
      hasActiveSelection: true,
      isNodeMenuOpen: false,
      searchQuery: "",
      activeTemplateId: "blank",
    };
  });
  const [fileState, setFileState] = useState<EditorFileState>({
    currentFileHandle: null,
    currentFileName: null,
    isPending: false,
    isStartupScreenVisible: true,
    lastError: null,
    lastSavedSnapshot: null,
    recentFiles: loadRecentMindMapFiles(),
  });
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const mindMap = editorState.history[editorState.historyIndex];
  const selectedNodeId = resolveSelectedNodeId(mindMap, editorState.selectedNodeId);
  const hasActiveSelection = editorState.hasActiveSelection;
  const selectedNode = mindMap.nodes[selectedNodeId];

  const commitDocument = useCallback(
    (
      mutate: (draft: MindMapDocument) => { selectedNodeId?: string } | void,
    ) => {
      setEditorState((current) => {
        const currentDocument = current.history[current.historyIndex];
        const nextDocument = cloneMindMapDocument(currentDocument);
        const result = mutate(nextDocument);
        const truncatedHistory = current.history.slice(0, current.historyIndex + 1);
        const nextHistoryBase = [...truncatedHistory, nextDocument];
        const nextHistory =
          nextHistoryBase.length > HISTORY_LIMIT
            ? nextHistoryBase.slice(nextHistoryBase.length - HISTORY_LIMIT)
            : nextHistoryBase;

        return {
          ...current,
          history: nextHistory,
          historyIndex: nextHistory.length - 1,
          selectedNodeId: resolveSelectedNodeId(
            nextDocument,
            result?.selectedNodeId ?? current.selectedNodeId,
          ),
        };
      });
    },
    [],
  );

  const selectNode = useCallback(
    (nodeId: string, options?: SelectNodeOptions) => {
      setEditorState((current) => {
        const currentDocument = current.history[current.historyIndex];
        if (!currentDocument.nodes[nodeId]) {
          return current;
        }

        return {
          ...current,
          selectedNodeId: nodeId,
          hasActiveSelection: true,
          isNodeMenuOpen: options?.openMenu ?? false,
        };
      });
      setIsInspectorOpen(options?.showInspector ?? true);

      if (options?.closeOutline) {
        setIsOutlineOpen(false);
      }

      if (options?.center) {
        requestAnimationFrame(() => {
          centerOnNode(nodeId);
        });
      }
    },
    [centerOnNode],
  );

  const closeNodeMenu = useCallback(() => {
    setEditorState((current) =>
      current.isNodeMenuOpen
        ? {
            ...current,
            isNodeMenuOpen: false,
          }
        : current,
    );
  }, []);

  const clearSelection = useCallback(() => {
    setEditorState((current) =>
      current.hasActiveSelection || current.isNodeMenuOpen
        ? {
            ...current,
            hasActiveSelection: false,
            isNodeMenuOpen: false,
          }
        : current,
    );
    setIsInspectorOpen(false);
  }, []);

  const undo = useCallback(() => {
    setEditorState((current) => {
      if (current.historyIndex === 0) {
        return current;
      }

      const nextIndex = current.historyIndex - 1;
      const nextDocument = current.history[nextIndex];

      return {
        ...current,
        historyIndex: nextIndex,
        selectedNodeId: resolveSelectedNodeId(
          nextDocument,
          current.selectedNodeId,
        ),
      };
    });
  }, []);

  const redo = useCallback(() => {
    setEditorState((current) => {
      if (current.historyIndex >= current.history.length - 1) {
        return current;
      }

      const nextIndex = current.historyIndex + 1;
      const nextDocument = current.history[nextIndex];

      return {
        ...current,
        historyIndex: nextIndex,
        selectedNodeId: resolveSelectedNodeId(
          nextDocument,
          current.selectedNodeId,
        ),
      };
    });
  }, []);

  const handleAddChild = useCallback(
    (parentId: string) => {
      let createdNodeId = parentId;

      commitDocument((draft) => {
        const result = createChildNode(draft, parentId);
        createdNodeId = result.nodeId;
        return { selectedNodeId: result.nodeId };
      });

      requestAnimationFrame(() => {
        centerOnNode(createdNodeId);
      });
      setIsInspectorOpen(true);
    },
    [centerOnNode, commitDocument],
  );

  const handleAddSibling = useCallback(
    (nodeId: string) => {
      let createdNodeId = nodeId;

      commitDocument((draft) => {
        const result = createSiblingNode(draft, nodeId);
        createdNodeId = result.nodeId;
        return { selectedNodeId: result.nodeId };
      });

      requestAnimationFrame(() => {
        centerOnNode(createdNodeId);
      });
      setIsInspectorOpen(true);
    },
    [centerOnNode, commitDocument],
  );

  const handleDeleteSelected = useCallback(() => {
    if (!hasActiveSelection || selectedNode.parentId === null) {
      return;
    }

    commitDocument((draft) => deleteNode(draft, selectedNodeId));
  }, [commitDocument, hasActiveSelection, selectedNode.parentId, selectedNodeId]);

  const handleAutoLayout = useCallback(() => {
    commitDocument((draft) => {
      updateNodePosition(draft, buildAutoLayoutPositions(draft));
    });
    closeNodeMenu();
    requestAnimationFrame(() => {
      centerOnNode(selectedNodeId);
    });
  }, [centerOnNode, closeNodeMenu, commitDocument, selectedNodeId]);

  const handleNodeTitleChange = useCallback(
    (nodeId: string, value: string) => {
      commitDocument((draft) => {
        const node = draft.nodes[nodeId];
        if (!node) {
          return;
        }

        draft.nodes[nodeId] = {
          ...node,
          title: value,
        };
      });
    },
    [commitDocument],
  );

  const handleNodeNotesChange = useCallback(
    (nodeId: string, value: string) => {
      commitDocument((draft) => {
        const node = draft.nodes[nodeId];
        if (!node) {
          return;
        }

        draft.nodes[nodeId] = {
          ...node,
          notes: value,
        };
      });
    },
    [commitDocument],
  );

  const handleNodeColorChange = useCallback(
    (nodeId: string, color: NodeColor) => {
      commitDocument((draft) => {
        const node = draft.nodes[nodeId];
        if (!node) {
          return;
        }

        draft.nodes[nodeId] = {
          ...node,
          color,
        };
      });
    },
    [commitDocument],
  );

  const handleToggleCollapsed = useCallback(
    (nodeId: string) => {
      commitDocument((draft) => {
        const node = draft.nodes[nodeId];
        if (!node || node.childrenIds.length === 0) {
          return;
        }

        draft.nodes[nodeId] = {
          ...node,
          collapsed: !node.collapsed,
        };
      });
    },
    [commitDocument],
  );

  const replaceDocument = useCallback(
    (
      document: MindMapDocument,
      options?: {
        fileHandle?: EditorFileState["currentFileHandle"];
        fileName?: string | null;
        lastSavedSnapshot?: string | null;
        recentFiles?: EditorFileState["recentFiles"];
      },
    ) => {
      const nextSelectedNodeId = resolveSelectedNodeId(document, document.rootId);

      setEditorState((current) => ({
        ...current,
        history: [document],
        historyIndex: 0,
        selectedNodeId: nextSelectedNodeId,
        hasActiveSelection: true,
        isNodeMenuOpen: false,
        searchQuery: "",
        activeTemplateId: "blank",
      }));
      setFileState((current) => ({
        ...current,
        currentFileHandle: options?.fileHandle ?? null,
        currentFileName: options?.fileName ?? null,
        isPending: false,
        isStartupScreenVisible: false,
        lastError: null,
        lastSavedSnapshot: options?.lastSavedSnapshot ?? null,
        recentFiles: options?.recentFiles ?? current.recentFiles,
      }));
      setIsOutlineOpen(false);
      setIsInspectorOpen(false);

      requestAnimationFrame(() => {
        centerOnNode(nextSelectedNodeId);
      });
    },
    [centerOnNode],
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

  const handleSaveFile = useCallback(async () => {
    setFileState((current) => ({
      ...current,
      isPending: true,
      lastError: null,
    }));

    try {
      const result = await saveMindMapFile({
        document: mindMap,
        existingFileHandle: fileState.currentFileHandle,
      });
      if (!result) {
        setFileState((current) => ({
          ...current,
          isPending: false,
        }));
        return;
      }

      setFileState((current) => ({
        ...current,
        currentFileHandle: result.fileHandle,
        currentFileName: result.fileName,
        isPending: false,
        isStartupScreenVisible: false,
        lastError: null,
        lastSavedSnapshot: result.contents,
        recentFiles: loadRecentMindMapFiles(),
      }));
    } catch (error) {
      setFileState((current) => ({
        ...current,
        isPending: false,
        lastError: getFileErrorMessage(error, "Unable to save the current map."),
      }));
    }
  }, [fileState.currentFileHandle, mindMap]);

  const handleExportFile = useCallback(
    async (format: ExportFormat) => {
      setFileState((current) => ({
        ...current,
        isPending: true,
        lastError: null,
      }));

      try {
        const contents = await buildMindMapExportBlob(mindMap, format);
        const result = await saveMindMapExportFile({
          contents,
          documentTitle: mindMap.title,
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
    [mindMap],
  );

  const setSearchQuery = useCallback((value: string) => {
    setEditorState((current) => ({
      ...current,
      searchQuery: value,
    }));
  }, []);

  const toggleOutline = useCallback(() => {
    setIsOutlineOpen((current) => !current);
  }, []);

  const hasUnsavedFileChanges = useMemo(() => {
    if (fileState.lastSavedSnapshot === null) {
      return false;
    }

    return serializeMindMapDocument(mindMap) !== fileState.lastSavedSnapshot;
  }, [fileState.lastSavedSnapshot, mindMap]);

  return useMemo(
    () => ({
      clearSelection,
      closeNodeMenu,
      commitDocument,
      editorState,
      fileState,
      handleAddChild,
      handleAddSibling,
      handleAutoLayout,
      handleDeleteSelected,
      handleExportFile,
      handleNodeColorChange,
      handleNodeNotesChange,
      handleOpenFile,
      handleOpenRecentFile,
      handleSaveFile,
      handleNodeTitleChange,
      handleToggleCollapsed,
      hasActiveSelection,
      hasUnsavedFileChanges,
      isInspectorOpen,
      isOutlineOpen,
      mindMap,
      redo,
      selectNode,
      selectedNode,
      selectedNodeId,
      setIsInspectorOpen,
      setIsOutlineOpen,
      setSearchQuery,
      toggleOutline,
      undo,
    }),
    [
      clearSelection,
      closeNodeMenu,
      commitDocument,
      editorState,
      fileState,
      handleAddChild,
      handleAddSibling,
      handleAutoLayout,
      handleDeleteSelected,
      handleExportFile,
      handleNodeColorChange,
      handleNodeNotesChange,
      handleOpenFile,
      handleOpenRecentFile,
      handleSaveFile,
      handleNodeTitleChange,
      handleToggleCollapsed,
      hasActiveSelection,
      hasUnsavedFileChanges,
      isInspectorOpen,
      isOutlineOpen,
      mindMap,
      redo,
      selectNode,
      selectedNode,
      selectedNodeId,
      setSearchQuery,
      toggleOutline,
      undo,
    ],
  );
}

function getFileErrorMessage(error: unknown, fallbackMessage: string): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const message = Reflect.get(error, "message");
    if (typeof message === "string" && message.trim()) {
      return message;
    }

    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}") {
        return serialized;
      }
    } catch {
      // Ignore serialization failures and use the fallback below.
    }
  }

  return fallbackMessage;
}
