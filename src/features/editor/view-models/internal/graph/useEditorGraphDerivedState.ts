import { useMemo } from "react";
import {
  getVisibleNodeIds,
} from "../../../../../domain/mindmap/treeQueries";
import { getNodeHeightForLayout } from "../../../../../domain/mindmap/layout";
import {
  MIN_CANVAS_HEIGHT,
  MIN_CANVAS_WIDTH,
  NODE_WIDTH,
} from "../../../constants";
import { useNodeDragging } from "../../../hooks/useNodeDragging";
import { useNodeReparenting } from "../../../hooks/useNodeReparenting";
import {
  buildConnectors,
  buildReparentPreviewConnector,
} from "../../../selectors/connectors";
import {
  buildNodeFocusStates,
  buildSelectedDescendantSet,
  buildSelectedLineageSet,
} from "../../../selectors/focus";
import { buildOutlineSearchVisibleSet, findSearchMatches } from "../../../selectors/search";
import { buildRenderPositions } from "../../../selectors/renderPositions";
import type { CameraState, Position } from "../../../types";
import type { ReturnTypeUseMindMapEditor } from "../useEditorWorkspaceCommands";

type UseEditorGraphDerivedStateArgs = {
  camera: CameraState;
  editor: ReturnTypeUseMindMapEditor;
  latestDocumentRef: React.MutableRefObject<
    import("../../../../../domain/mindmap/model").MindMapDocument | null
  >;
  viewportSize: { width: number; height: number };
};

export function useEditorGraphDerivedState({
  camera,
  editor,
  latestDocumentRef,
  viewportSize,
}: UseEditorGraphDerivedStateArgs) {
  latestDocumentRef.current = editor.mindMap;

  const canvasWidth = Math.max(viewportSize.width, MIN_CANVAS_WIDTH);
  const canvasHeight = Math.max(viewportSize.height, MIN_CANVAS_HEIGHT);

  const draggingState = useNodeDragging({
    commitDocument: editor.commitDocument,
    latestDocumentRef,
    mindMap: editor.mindMap,
    selectNode: editor.selectNode,
    viewportScale: camera.scale,
  });
  const reparentingState = useNodeReparenting({
    handleReparentNode: editor.handleReparentNode,
    mindMap: editor.mindMap,
    selectNode: editor.selectNode,
  });

  const renderPositions = useMemo(
    () => buildRenderPositions(editor.mindMap, draggingState.dragging),
    [draggingState.dragging, editor.mindMap],
  );
  const stagePositions = useMemo(() => {
    return Object.fromEntries(
      Object.entries(renderPositions).map(([nodeId, position]) => [
        nodeId,
        {
          x: (position.x - camera.x) * camera.scale,
          y: (position.y - camera.y) * camera.scale,
        },
      ]),
    ) as Record<string, Position>;
  }, [camera.scale, camera.x, camera.y, renderPositions]);

  const visibleNodeIds = useMemo(
    () => getVisibleNodeIds(editor.mindMap),
    [editor.mindMap],
  );
  const visibleNodeIdSet = useMemo(
    () => new Set(visibleNodeIds),
    [visibleNodeIds],
  );
  const selectedLineageSet = useMemo(
    () =>
      buildSelectedLineageSet(
        editor.mindMap,
        editor.selectedNodeId,
        editor.hasActiveSelection,
      ),
    [editor.hasActiveSelection, editor.mindMap, editor.selectedNodeId],
  );
  const selectedDescendantSet = useMemo(
    () =>
      buildSelectedDescendantSet(
        editor.mindMap,
        editor.selectedNodeId,
        editor.hasActiveSelection,
      ),
    [editor.hasActiveSelection, editor.mindMap, editor.selectedNodeId],
  );
  const nodeFocusStates = useMemo(
    () =>
      buildNodeFocusStates(
        visibleNodeIds,
        editor.hasActiveSelection,
        editor.selectedNodeId,
        selectedLineageSet,
        selectedDescendantSet,
      ),
    [
      editor.hasActiveSelection,
      editor.selectedNodeId,
      selectedDescendantSet,
      selectedLineageSet,
      visibleNodeIds,
    ],
  );
  const searchMatches = useMemo(
    () => findSearchMatches(editor.mindMap, editor.editorState.searchQuery),
    [editor.editorState.searchQuery, editor.mindMap],
  );
  const searchMatchIds = useMemo(
    () => new Set(searchMatches.map((node) => node.id)),
    [searchMatches],
  );
  const outlineSearchVisibleSet = useMemo(
    () =>
      buildOutlineSearchVisibleSet(
        editor.mindMap,
        editor.editorState.searchQuery,
      ),
    [editor.editorState.searchQuery, editor.mindMap],
  );

  const visibleWorldBounds = useMemo(() => {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const nodeId of visibleNodeIds) {
      const node = editor.mindMap.nodes[nodeId];
      const position = renderPositions[nodeId];

      if (!node || !position) {
        continue;
      }

      const nodeHeight = getNodeHeightForLayout(editor.layoutType, node);
      minX = Math.min(minX, position.x);
      minY = Math.min(minY, position.y);
      maxX = Math.max(maxX, position.x + NODE_WIDTH);
      maxY = Math.max(maxY, position.y + nodeHeight);
    }

    if (
      !Number.isFinite(minX) ||
      !Number.isFinite(minY) ||
      !Number.isFinite(maxX) ||
      !Number.isFinite(maxY)
    ) {
      return null;
    }

    return { minX, minY, maxX, maxY };
  }, [editor.layoutType, editor.mindMap, renderPositions, visibleNodeIds]);

  const connectors = useMemo(
    () =>
      buildConnectors(
        editor.mindMap,
        editor.layoutType,
        visibleNodeIds,
        visibleNodeIdSet,
        stagePositions,
        camera.scale,
        nodeFocusStates,
      ),
    [
      camera.scale,
      editor.layoutType,
      editor.mindMap,
      nodeFocusStates,
      stagePositions,
      visibleNodeIdSet,
      visibleNodeIds,
    ],
  );
  const visibleConnectors = useMemo(() => {
    if (!reparentingState.reparenting) {
      return connectors;
    }

    return connectors.filter(
      (connector) => connector.id !== reparentingState.reparenting?.nodeId,
    );
  }, [connectors, reparentingState.reparenting]);
  const previewConnector = useMemo(
    () =>
      buildReparentPreviewConnector(
        editor.mindMap,
        editor.layoutType,
        stagePositions,
        camera.scale,
        reparentingState.reparenting,
      ),
    [
      camera.scale,
      editor.layoutType,
      editor.mindMap,
      reparentingState.reparenting,
      stagePositions,
    ],
  );

  return {
    canvasHeight,
    canvasWidth,
    draggingState,
    nodeFocusStates,
    outlineSearchVisibleSet,
    previewConnector,
    renderPositions,
    reparentingState,
    searchMatchIds,
    searchMatches,
    stagePositions,
    visibleConnectors,
    visibleNodeIdSet,
    visibleNodeIds,
    visibleWorldBounds,
  };
}
