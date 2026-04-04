import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cloneMindMapDocument,
  createBlankMindMap,
  createChildNode,
  createSiblingNode,
  deleteNode,
  loadStoredMindMap,
  loadStoredTemplateId,
  resolveSelectedNodeId,
  saveMindMap,
  saveTemplateId,
  updateNodePosition,
  type MindMapDocument,
  type NodeColor,
} from "../../../mindmap";
import { HISTORY_LIMIT } from "../constants";
import { buildAutoLayoutPositions } from "../layout";
import type { EditorState, SelectNodeOptions } from "../types";

type UseMindMapEditorArgs = {
  centerOnNode: (nodeId: string) => boolean;
};

export function useMindMapEditor({ centerOnNode }: UseMindMapEditorArgs) {
  const [editorState, setEditorState] = useState<EditorState>(() => {
    const storedDocument = loadStoredMindMap() ?? createBlankMindMap("Focus Map");
    const activeTemplateId = loadStoredTemplateId() ?? "blank";

    return {
      history: [storedDocument],
      historyIndex: 0,
      selectedNodeId: storedDocument.rootId,
      hasActiveSelection: true,
      isNodeMenuOpen: false,
      searchQuery: "",
      activeTemplateId,
    };
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

  const setSearchQuery = useCallback((value: string) => {
    setEditorState((current) => ({
      ...current,
      searchQuery: value,
    }));
  }, []);

  const toggleOutline = useCallback(() => {
    setIsOutlineOpen((current) => !current);
  }, []);

  useEffect(() => {
    saveMindMap(mindMap);
    saveTemplateId(editorState.activeTemplateId);
  }, [editorState.activeTemplateId, mindMap]);

  return useMemo(
    () => ({
      clearSelection,
      closeNodeMenu,
      commitDocument,
      editorState,
      handleAddChild,
      handleAddSibling,
      handleAutoLayout,
      handleDeleteSelected,
      handleNodeColorChange,
      handleNodeNotesChange,
      handleNodeTitleChange,
      handleToggleCollapsed,
      hasActiveSelection,
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
      handleAddChild,
      handleAddSibling,
      handleAutoLayout,
      handleDeleteSelected,
      handleNodeColorChange,
      handleNodeNotesChange,
      handleNodeTitleChange,
      handleToggleCollapsed,
      hasActiveSelection,
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
