import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  getBranchDirection,
  getSubtreeIds,
  updateNodePosition,
  type MindMapDocument,
} from "../../../mindmap";
import { MIN_BRANCH_GAP, NODE_WIDTH } from "../constants";
import type { DraggingState, Position, SelectNodeOptions } from "../types";

type UseNodeDraggingArgs = {
  commitDocument: (
    mutate: (draft: MindMapDocument) => { selectedNodeId?: string } | void,
  ) => void;
  latestDocumentRef: MutableRefObject<MindMapDocument | null>;
  mindMap: MindMapDocument;
  selectNode: (nodeId: string, options?: SelectNodeOptions) => void;
};

export function useNodeDragging({
  commitDocument,
  latestDocumentRef,
  mindMap,
  selectNode,
}: UseNodeDraggingArgs) {
  const [dragging, setDragging] = useState<DraggingState | null>(null);

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      setDragging((current) => {
        if (!current) {
          return null;
        }

        const document = latestDocumentRef.current;
        if (!document) {
          return current;
        }

        const node = document.nodes[current.nodeId];
        const origin = current.originPositions[current.nodeId];
        let deltaX = event.clientX - current.pointerOrigin.x;
        const deltaY = event.clientY - current.pointerOrigin.y;

        if (node?.parentId) {
          const parent = document.nodes[node.parentId];
          if (parent && parent.parentId !== null && origin) {
            const direction = getBranchDirection(document, current.nodeId);

            if (direction === 1) {
              const minX = parent.x + NODE_WIDTH + MIN_BRANCH_GAP;
              deltaX = Math.max(deltaX, minX - origin.x);
            } else {
              const maxX = parent.x - NODE_WIDTH - MIN_BRANCH_GAP;
              deltaX = Math.min(deltaX, maxX - origin.x);
            }
          }
        }

        return {
          ...current,
          delta: {
            x: deltaX,
            y: deltaY,
          },
        };
      });
    };

    const handlePointerUp = () => {
      setDragging((current) => {
        if (!current) {
          return null;
        }

        const moved =
          Math.abs(current.delta.x) > 2 || Math.abs(current.delta.y) > 2;

        if (moved) {
          const positions = Object.fromEntries(
            current.subtreeIds.map((nodeId) => {
              const origin = current.originPositions[nodeId];

              return [
                nodeId,
                {
                  x: origin.x + current.delta.x,
                  y: origin.y + current.delta.y,
                },
              ];
            }),
          ) as Record<string, Position>;

          commitDocument((draft) => {
            updateNodePosition(draft, positions);
          });
        }

        return null;
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [commitDocument, dragging, latestDocumentRef]);

  const startDragging = useCallback(
    (nodeId: string, event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const subtreeIds = getSubtreeIds(mindMap, nodeId);
      const originPositions = Object.fromEntries(
        subtreeIds.map((currentId) => {
          const node = mindMap.nodes[currentId];
          return [currentId, { x: node.x, y: node.y }];
        }),
      ) as Record<string, Position>;

      selectNode(nodeId, { openMenu: false, showInspector: true });
      setDragging({
        nodeId,
        subtreeIds,
        pointerOrigin: { x: event.clientX, y: event.clientY },
        originPositions,
        delta: { x: 0, y: 0 },
      });
    },
    [mindMap, selectNode],
  );

  return {
    dragging,
    startDragging,
  };
}
