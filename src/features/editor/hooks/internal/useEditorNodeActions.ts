import { useCallback, useMemo } from "react";
import {
  syncClassicRootBranchDirections,
} from "../../../../domain/mindmap/classicBranchSync";
import {
  createChildNode,
  createSiblingNode,
  deleteNode,
  duplicateNodeSubtree,
  updateNodePosition,
} from "../../../../domain/mindmap/nodeMutations";
import { canReparentNode, reparentNode } from "../../../../domain/mindmap/reparenting";
import {
  getMindMapLayoutType,
  setMindMapBackgroundPresetId,
  setMindMapLayoutType,
} from "../../../../domain/mindmap/documents";
import {
  isClassicMindMapLayoutType,
  isLogicChartLayoutType,
} from "../../../../domain/mindmap/model";
import type {
  MindMapDocument,
  MindMapLayoutType,
  MindMapNode,
} from "../../../../domain/mindmap/model";
import type { MindMapBackgroundPresetId } from "../../../../domain/mindmap/backgroundPresets/presetCatalog";
import { buildLayoutPositions } from "../../layout";
import { useEditorNodePropertyActions } from "./useEditorNodePropertyActions";

type UseEditorNodeActionsArgs = {
  backgroundPresetId: MindMapBackgroundPresetId;
  centerOnNode: (nodeId: string) => boolean;
  closeNodeMenu: () => void;
  commitDocument: (
    mutate: (draft: MindMapDocument) => { selectedNodeId?: string } | void,
  ) => void;
  hasActiveSelection: boolean;
  layoutType: MindMapLayoutType;
  mindMap: MindMapDocument;
  selectedNode: MindMapNode;
  selectedNodeId: string;
  setIsInspectorOpen: (value: boolean) => void;
};

export function useEditorNodeActions({
  backgroundPresetId,
  centerOnNode,
  closeNodeMenu,
  commitDocument,
  hasActiveSelection,
  layoutType,
  mindMap,
  selectedNode,
  selectedNodeId,
  setIsInspectorOpen,
}: UseEditorNodeActionsArgs) {
  const canExpandAll = useMemo(
    () =>
      Object.values(mindMap.nodes).some(
        (node) => node.childrenIds.length > 0 && node.collapsed,
      ),
    [mindMap],
  );

  const canCollapseAll = useMemo(
    () =>
      Object.values(mindMap.nodes).some(
        (node) =>
          node.parentId !== null &&
          node.childrenIds.length > 0 &&
          !node.collapsed,
      ),
    [mindMap],
  );

  const applyLayoutToDocument = useCallback(
    (draft: MindMapDocument, nextLayoutType: MindMapLayoutType) => {
      updateNodePosition(draft, buildLayoutPositions(draft, nextLayoutType));
    },
    [],
  );

  const applyLogicChartLayoutIfNeeded = useCallback(
    (draft: MindMapDocument) => {
      const nextLayoutType = getMindMapLayoutType(draft);
      if (!isLogicChartLayoutType(nextLayoutType)) {
        return;
      }

      applyLayoutToDocument(draft, nextLayoutType);
    },
    [applyLayoutToDocument],
  );

  const handleAddChild = useCallback(
    (parentId: string) => {
      let createdNodeId = parentId;

      commitDocument((draft) => {
        const result = createChildNode(draft, parentId);
        applyLogicChartLayoutIfNeeded(draft);
        createdNodeId = result.nodeId;
        return { selectedNodeId: result.nodeId };
      });

      requestAnimationFrame(() => {
        centerOnNode(createdNodeId);
      });
      setIsInspectorOpen(true);
    },
    [
      applyLogicChartLayoutIfNeeded,
      centerOnNode,
      commitDocument,
      setIsInspectorOpen,
    ],
  );

  const handleAddSibling = useCallback(
    (nodeId: string) => {
      let createdNodeId = nodeId;

      commitDocument((draft) => {
        const result = createSiblingNode(draft, nodeId);
        applyLogicChartLayoutIfNeeded(draft);
        createdNodeId = result.nodeId;
        return { selectedNodeId: result.nodeId };
      });

      requestAnimationFrame(() => {
        centerOnNode(createdNodeId);
      });
      setIsInspectorOpen(true);
    },
    [
      applyLogicChartLayoutIfNeeded,
      centerOnNode,
      commitDocument,
      setIsInspectorOpen,
    ],
  );

  const handleDeleteSelected = useCallback(() => {
    if (!hasActiveSelection || selectedNode.parentId === null) {
      return;
    }

    commitDocument((draft) => {
      const result = deleteNode(draft, selectedNodeId);
      applyLogicChartLayoutIfNeeded(draft);
      return result;
    });
  }, [
    applyLogicChartLayoutIfNeeded,
    commitDocument,
    hasActiveSelection,
    selectedNode.parentId,
    selectedNodeId,
  ]);

  const handleDuplicateSelected = useCallback(() => {
    if (!hasActiveSelection || selectedNode.parentId === null) {
      return;
    }

    let duplicatedNodeId = selectedNodeId;

    commitDocument((draft) => {
      const result = duplicateNodeSubtree(draft, selectedNodeId);
      applyLogicChartLayoutIfNeeded(draft);
      duplicatedNodeId = result.nodeId;
      return { selectedNodeId: result.nodeId };
    });

    requestAnimationFrame(() => {
      centerOnNode(duplicatedNodeId);
    });
    setIsInspectorOpen(true);
  }, [
    applyLogicChartLayoutIfNeeded,
    centerOnNode,
    commitDocument,
    hasActiveSelection,
    selectedNode.parentId,
    selectedNodeId,
    setIsInspectorOpen,
  ]);

  const handleReparentNode = useCallback(
    (
      nodeId: string,
      nextParentId: string,
      options?: { rootDirection?: -1 | 1 },
    ) => {
      if (!canReparentNode(mindMap, nodeId, nextParentId)) {
        return;
      }

      commitDocument((draft) => {
        const result = reparentNode(draft, nodeId, nextParentId, options);
        if (!result.moved) {
          return;
        }

        applyLogicChartLayoutIfNeeded(draft);
        return { selectedNodeId: result.nodeId };
      });
      closeNodeMenu();
      setIsInspectorOpen(false);
    },
    [
      applyLogicChartLayoutIfNeeded,
      closeNodeMenu,
      commitDocument,
      mindMap,
      setIsInspectorOpen,
    ],
  );

  const handleAutoLayout = useCallback(() => {
    commitDocument((draft) => {
      applyLayoutToDocument(draft, getMindMapLayoutType(draft));
    });
    closeNodeMenu();
    requestAnimationFrame(() => {
      centerOnNode(selectedNodeId);
    });
  }, [
    applyLayoutToDocument,
    centerOnNode,
    closeNodeMenu,
    commitDocument,
    selectedNodeId,
  ]);

  const handleLayoutTypeChange = useCallback(
    (nextLayoutType: MindMapLayoutType) => {
      if (nextLayoutType === layoutType) {
        return;
      }

      commitDocument((draft) => {
        if (isClassicMindMapLayoutType(layoutType)) {
          syncClassicRootBranchDirections(draft);
        }

        setMindMapLayoutType(draft, nextLayoutType);
        applyLayoutToDocument(draft, nextLayoutType);
      });
      closeNodeMenu();
      requestAnimationFrame(() => {
        centerOnNode(selectedNodeId);
      });
    },
    [
      applyLayoutToDocument,
      centerOnNode,
      closeNodeMenu,
      commitDocument,
      layoutType,
      selectedNodeId,
    ],
  );

  const handleBackgroundPresetChange = useCallback(
    (nextBackgroundPresetId: MindMapBackgroundPresetId) => {
      if (nextBackgroundPresetId === backgroundPresetId) {
        return;
      }

      commitDocument((draft) => {
        setMindMapBackgroundPresetId(draft, nextBackgroundPresetId);
      });
      closeNodeMenu();
    },
    [backgroundPresetId, closeNodeMenu, commitDocument],
  );

  const propertyActions = useEditorNodePropertyActions({
    applyLogicChartLayoutIfNeeded,
    canCollapseAll,
    canExpandAll,
    commitDocument,
  });

  return useMemo(
    () => ({
      canCollapseAll,
      canExpandAll,
      handleAddChild,
      handleAddSibling,
      handleAutoLayout,
      handleBackgroundPresetChange,
      handleDeleteSelected,
      handleDuplicateSelected,
      handleLayoutTypeChange,
      handleReparentNode,
      ...propertyActions,
    }),
    [
      canCollapseAll,
      canExpandAll,
      handleAddChild,
      handleAddSibling,
      handleAutoLayout,
      handleBackgroundPresetChange,
      handleDeleteSelected,
      handleDuplicateSelected,
      handleLayoutTypeChange,
      handleReparentNode,
      propertyActions,
    ],
  );
}
