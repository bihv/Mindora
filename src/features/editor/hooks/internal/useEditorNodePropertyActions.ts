import { useCallback, useMemo } from "react";
import { setMindMapNodeKind } from "../../../../domain/mindmap/nodeContent";
import type {
  MindMapDocument,
  MindMapNodeKind,
  NodeColor,
} from "../../../../domain/mindmap/model";

type UseEditorNodePropertyActionsArgs = {
  applyLogicChartLayoutIfNeeded: (draft: MindMapDocument) => void;
  canCollapseAll: boolean;
  canExpandAll: boolean;
  commitDocument: (
    mutate: (draft: MindMapDocument) => { selectedNodeId?: string } | void,
  ) => void;
};

export function useEditorNodePropertyActions({
  applyLogicChartLayoutIfNeeded,
  canCollapseAll,
  canExpandAll,
  commitDocument,
}: UseEditorNodePropertyActionsArgs) {
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
        applyLogicChartLayoutIfNeeded(draft);
      });
    },
    [applyLogicChartLayoutIfNeeded, commitDocument],
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
        applyLogicChartLayoutIfNeeded(draft);
      });
    },
    [applyLogicChartLayoutIfNeeded, commitDocument],
  );

  const handleNodeKindChange = useCallback(
    (nodeId: string, kind: MindMapNodeKind) => {
      commitDocument((draft) => {
        const node = draft.nodes[nodeId];
        if (!node) {
          return;
        }

        draft.nodes[nodeId] = setMindMapNodeKind(node, kind);
        applyLogicChartLayoutIfNeeded(draft);
      });
    },
    [applyLogicChartLayoutIfNeeded, commitDocument],
  );

  const handleNodeImageUrlChange = useCallback(
    (nodeId: string, value: string) => {
      commitDocument((draft) => {
        const node = draft.nodes[nodeId];
        if (!node || node.kind !== "image") {
          return;
        }

        draft.nodes[nodeId] = {
          ...node,
          data: {
            imageUrl: value,
          },
        };
        applyLogicChartLayoutIfNeeded(draft);
      });
    },
    [applyLogicChartLayoutIfNeeded, commitDocument],
  );

  const handleNodeLinkUrlChange = useCallback(
    (nodeId: string, value: string) => {
      commitDocument((draft) => {
        const node = draft.nodes[nodeId];
        if (!node || node.kind !== "link") {
          return;
        }

        draft.nodes[nodeId] = {
          ...node,
          data: {
            url: value,
          },
        };
        applyLogicChartLayoutIfNeeded(draft);
      });
    },
    [applyLogicChartLayoutIfNeeded, commitDocument],
  );

  const handleNodeEmojiChange = useCallback(
    (nodeId: string, value: string) => {
      commitDocument((draft) => {
        const node = draft.nodes[nodeId];
        if (!node || node.kind !== "emoji") {
          return;
        }

        draft.nodes[nodeId] = {
          ...node,
          data: {
            emoji: value,
          },
        };
        applyLogicChartLayoutIfNeeded(draft);
      });
    },
    [applyLogicChartLayoutIfNeeded, commitDocument],
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

  const handleExpandAll = useCallback(() => {
    if (!canExpandAll) {
      return;
    }

    commitDocument((draft) => {
      for (const node of Object.values(draft.nodes)) {
        if (node.childrenIds.length === 0 || !node.collapsed) {
          continue;
        }

        draft.nodes[node.id] = {
          ...node,
          collapsed: false,
        };
      }
    });
  }, [canExpandAll, commitDocument]);

  const handleCollapseAll = useCallback(() => {
    if (!canCollapseAll) {
      return;
    }

    commitDocument((draft) => {
      for (const node of Object.values(draft.nodes)) {
        if (
          node.parentId === null ||
          node.childrenIds.length === 0 ||
          node.collapsed
        ) {
          continue;
        }

        draft.nodes[node.id] = {
          ...node,
          collapsed: true,
        };
      }
    });
  }, [canCollapseAll, commitDocument]);

  return useMemo(
    () => ({
      handleCollapseAll,
      handleExpandAll,
      handleNodeColorChange,
      handleNodeEmojiChange,
      handleNodeImageUrlChange,
      handleNodeKindChange,
      handleNodeLinkUrlChange,
      handleNodeNotesChange,
      handleNodeTitleChange,
      handleToggleCollapsed,
    }),
    [
      handleCollapseAll,
      handleExpandAll,
      handleNodeColorChange,
      handleNodeEmojiChange,
      handleNodeImageUrlChange,
      handleNodeKindChange,
      handleNodeLinkUrlChange,
      handleNodeNotesChange,
      handleNodeTitleChange,
      handleToggleCollapsed,
    ],
  );
}
