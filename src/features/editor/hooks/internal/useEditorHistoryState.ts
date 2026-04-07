import { useCallback, useMemo, useState } from "react";
import {
  cloneMindMapDocument,
} from "../../../../domain/mindmap/documents";
import { resolveSelectedNodeId } from "../../../../domain/mindmap/treeQueries";
import type { MindMapDocument } from "../../../../domain/mindmap/model";
import { HISTORY_LIMIT } from "../../constants";
import type { EditorState, SelectNodeOptions } from "../../types";

type UseEditorHistoryStateArgs = {
  centerOnNode: (nodeId: string) => boolean;
  createInitialDocument: () => MindMapDocument;
  setIsInspectorOpen: (value: boolean) => void;
  setIsOutlineOpen: (value: boolean) => void;
};

export function useEditorHistoryState({
  centerOnNode,
  createInitialDocument,
  setIsInspectorOpen,
  setIsOutlineOpen,
}: UseEditorHistoryStateArgs) {
  const [editorState, setEditorState] = useState<EditorState>(() => {
    const initialDocument = createInitialDocument();

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
    [centerOnNode, setIsInspectorOpen, setIsOutlineOpen],
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
  }, [setIsInspectorOpen]);

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

  const replaceEditorDocument = useCallback((document: MindMapDocument) => {
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

    return nextSelectedNodeId;
  }, []);

  const setSearchQuery = useCallback((value: string) => {
    setEditorState((current) => ({
      ...current,
      searchQuery: value,
    }));
  }, []);

  return useMemo(
    () => ({
      clearSelection,
      closeNodeMenu,
      commitDocument,
      editorState,
      hasActiveSelection,
      mindMap,
      redo,
      replaceEditorDocument,
      selectNode,
      selectedNode,
      selectedNodeId,
      setSearchQuery,
      undo,
    }),
    [
      clearSelection,
      closeNodeMenu,
      commitDocument,
      editorState,
      hasActiveSelection,
      mindMap,
      redo,
      replaceEditorDocument,
      selectNode,
      selectedNode,
      selectedNodeId,
      setSearchQuery,
      undo,
    ],
  );
}
