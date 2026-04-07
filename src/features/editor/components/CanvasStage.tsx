import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import {
  isLogicChartLayoutType,
} from "../../../domain/mindmap/model";
import type {
  MindMapDocument,
  MindMapLayoutType,
} from "../../../domain/mindmap/model";
import { joinClassNames } from "../../../shared/classNames";
import {
  getCanvasBackgroundStyle,
} from "../../../domain/mindmap/backgroundPresets/canvasBackgroundStyle";
import type { MindMapBackgroundPresetId } from "../../../domain/mindmap/backgroundPresets/presetCatalog";
import type {
  CameraState,
  ConnectorItem,
  ConnectorPreviewItem,
  NodeFocusState,
  Position,
} from "../types";
import styles from "./CanvasStageShell.module.css";
import { CanvasStageConnections } from "./CanvasStageConnections";
import { CanvasStageNode } from "./CanvasStageNode";

type CanvasStageProps = {
  camera: CameraState;
  connectors: ConnectorItem[];
  backgroundPresetId: MindMapBackgroundPresetId;
  draggingNodeId: string | null;
  hasActiveSelection: boolean;
  layoutType: MindMapLayoutType;
  mindMap: MindMapDocument;
  nodeFocusStates: Record<string, NodeFocusState>;
  onCanvasClick: () => void;
  onNodeContextMenu: (
    nodeId: string,
    event: ReactMouseEvent<HTMLElement>,
  ) => void;
  onNodeConnectorPointerDown: (
    nodeId: string,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  onNodePointerDown: (
    nodeId: string,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  onNodeSelect: (nodeId: string) => void;
  onNodeImageView: (nodeId: string) => void;
  onToggleCollapsed: (nodeId: string) => void;
  onStagePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  panning: boolean;
  searchMatchIds: Set<string>;
  selectedNodeId: string;
  stagePositions: Record<string, Position>;
  previewConnector: ConnectorPreviewItem | null;
  reparentTargetNodeId: string | null;
  visibleNodeIds: string[];
  children?: ReactNode;
};

export function CanvasStage({
  camera,
  connectors,
  backgroundPresetId,
  draggingNodeId,
  hasActiveSelection,
  layoutType,
  mindMap,
  nodeFocusStates,
  onCanvasClick,
  onNodeContextMenu,
  onNodeConnectorPointerDown,
  onNodePointerDown,
  onNodeSelect,
  onNodeImageView,
  onToggleCollapsed,
  onStagePointerDown,
  panning,
  previewConnector,
  reparentTargetNodeId,
  searchMatchIds,
  selectedNodeId,
  stagePositions,
  visibleNodeIds,
  children,
}: CanvasStageProps) {
  const isOrganicLayout = isLogicChartLayoutType(layoutType);
  const canvasBackgroundStyle = getCanvasBackgroundStyle(
    backgroundPresetId,
    camera,
  );

  return (
    <div
      className={joinClassNames(
        styles.canvasStage,
        isOrganicLayout && styles.canvasStageOrganic,
        panning && styles.canvasStagePanning,
      )}
      data-canvas-stage="true"
      onClick={onCanvasClick}
      onPointerDown={onStagePointerDown}
      style={canvasBackgroundStyle}
    >
      <CanvasStageConnections
        cameraScale={camera.scale}
        connectors={connectors}
        previewConnector={previewConnector}
      />

      {visibleNodeIds.map((nodeId) => {
        const node = mindMap.nodes[nodeId];
        const position = stagePositions[nodeId];

        if (!node || !position) {
          return null;
        }

        return (
          <CanvasStageNode
            cameraScale={camera.scale}
            focusState={nodeFocusStates[nodeId] ?? "dimmed"}
            isDragging={draggingNodeId === nodeId}
            isMatched={searchMatchIds.has(nodeId)}
            isReparentTarget={reparentTargetNodeId === node.id}
            isSelected={hasActiveSelection && nodeId === selectedNodeId}
            key={node.id}
            layoutType={layoutType}
            node={node}
            onNodeConnectorPointerDown={onNodeConnectorPointerDown}
            onNodeContextMenu={onNodeContextMenu}
            onNodeImageView={onNodeImageView}
            onNodePointerDown={onNodePointerDown}
            onNodeSelect={onNodeSelect}
            onToggleCollapsed={onToggleCollapsed}
            document={mindMap}
            position={position}
          />
        );
      })}

      {children}
    </div>
  );
}
