import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { canReparentNode } from "../../../domain/mindmap/reparenting";
import { getSubtreeIds } from "../../../domain/mindmap/treeQueries";
import type { MindMapDocument } from "../../../domain/mindmap/model";
import type { NodeReparentingState, SelectNodeOptions } from "../types";

type ActiveNodeReparentingState = NodeReparentingState & {
  blockedNodeIds: Set<string>;
  stageOrigin: {
    x: number;
    y: number;
  };
};

type UseNodeReparentingArgs = {
  handleReparentNode: (
    nodeId: string,
    nextParentId: string,
    options?: { rootDirection?: -1 | 1 },
  ) => void;
  mindMap: MindMapDocument;
  selectNode: (nodeId: string, options?: SelectNodeOptions) => void;
};

export function useNodeReparenting({
  handleReparentNode,
  mindMap,
  selectNode,
}: UseNodeReparentingArgs) {
  const [reparenting, setReparenting] = useState<ActiveNodeReparentingState | null>(
    null,
  );

  useEffect(() => {
    if (!reparenting) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      setReparenting((current) => {
        if (!current) {
          return null;
        }

        const pointerPosition = {
          x: event.clientX - current.stageOrigin.x,
          y: event.clientY - current.stageOrigin.y,
        };
        const hoveredElement = document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLElement>("[data-node-id]");
        const hoveredNodeId = hoveredElement?.dataset.nodeId ?? null;
        const hoveredNode = hoveredNodeId ? mindMap.nodes[hoveredNodeId] : null;
        const hoveredRect = hoveredElement?.getBoundingClientRect();
        const isValidTarget =
          hoveredNodeId !== null &&
          !current.blockedNodeIds.has(hoveredNodeId) &&
          canReparentNode(mindMap, current.nodeId, hoveredNodeId);
        const rootDirection =
          isValidTarget && hoveredNode?.parentId === null && hoveredRect
            ? event.clientX <
              hoveredRect.left + hoveredRect.width / 2
              ? -1
              : 1
            : null;

        return {
          ...current,
          candidateParentId: isValidTarget ? hoveredNodeId : null,
          pointerPosition,
          rootDirection,
        };
      });
    };

    const handlePointerUp = () => {
      setReparenting((current) => {
        if (!current) {
          return null;
        }

        if (current.candidateParentId) {
          handleReparentNode(current.nodeId, current.candidateParentId, {
            rootDirection: current.rootDirection ?? undefined,
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
  }, [handleReparentNode, mindMap, reparenting]);

  const startReparenting = useCallback(
    (nodeId: string, event: ReactPointerEvent<HTMLElement>) => {
      const stageElement = event.currentTarget.closest<HTMLElement>("[data-canvas-stage]");
      if (!stageElement) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const stageRect = stageElement.getBoundingClientRect();
      // Reparenting should focus the source node without opening the inspector.
      selectNode(nodeId, { openMenu: false, showInspector: false });
      setReparenting({
        blockedNodeIds: new Set(getSubtreeIds(mindMap, nodeId)),
        candidateParentId: null,
        nodeId,
        pointerPosition: {
          x: event.clientX - stageRect.left,
          y: event.clientY - stageRect.top,
        },
        rootDirection: null,
        stageOrigin: {
          x: stageRect.left,
          y: stageRect.top,
        },
      });
    },
    [mindMap, selectNode],
  );

  return {
    reparenting: reparenting
      ? {
          candidateParentId: reparenting.candidateParentId,
          nodeId: reparenting.nodeId,
          pointerPosition: reparenting.pointerPosition,
          rootDirection: reparenting.rootDirection,
        }
      : null,
    startReparenting,
  };
}
