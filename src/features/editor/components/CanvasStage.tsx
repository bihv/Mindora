import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { NODE_COLORS, type MindMapDocument } from "../../../mindmap";
import styles from "./CanvasStage.module.css";
import { truncateText } from "../utils";
import type {
  CameraState,
  ConnectorItem,
  NodeFocusState,
  Position,
} from "../types";

type CanvasStageProps = {
  camera: CameraState;
  connectors: ConnectorItem[];
  draggingNodeId: string | null;
  hasActiveSelection: boolean;
  mindMap: MindMapDocument;
  nodeFocusStates: Record<string, NodeFocusState>;
  onCanvasClick: () => void;
  onNodeContextMenu: (
    nodeId: string,
    event: ReactMouseEvent<HTMLElement>,
  ) => void;
  onNodePointerDown: (
    nodeId: string,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  onNodeSelect: (nodeId: string) => void;
  onToggleCollapsed: (nodeId: string) => void;
  onStagePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  panning: boolean;
  searchMatchIds: Set<string>;
  selectedNodeId: string;
  stagePositions: Record<string, Position>;
  visibleNodeIds: string[];
  children?: ReactNode;
};

const connectorFocusClassNames: Record<ConnectorItem["focusState"], string> = {
  lineage: styles.connectionsPathLineage,
  descendant: styles.connectionsPathDescendant,
  dimmed: styles.connectionsPathDimmed,
};

const nodeFocusClassNames: Record<NodeFocusState, string> = {
  selected: styles.mindNodeFocusSelected,
  lineage: styles.mindNodeFocusLineage,
  descendant: styles.mindNodeFocusDescendant,
  dimmed: styles.mindNodeFocusDimmed,
};

export function CanvasStage({
  camera,
  connectors,
  draggingNodeId,
  hasActiveSelection,
  mindMap,
  nodeFocusStates,
  onCanvasClick,
  onNodeContextMenu,
  onNodePointerDown,
  onNodeSelect,
  onToggleCollapsed,
  onStagePointerDown,
  panning,
  searchMatchIds,
  selectedNodeId,
  stagePositions,
  visibleNodeIds,
  children,
}: CanvasStageProps) {
  return (
    <div
      className={[
        styles.canvasStage,
        panning ? styles.canvasStagePanning : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onCanvasClick}
      onPointerDown={onStagePointerDown}
      style={{
        backgroundPosition: `${-camera.x}px ${-camera.y}px, ${-camera.x}px ${-camera.y}px, center`,
      }}
    >
      <svg
        aria-hidden="true"
        className={styles.connections}
        height="100%"
        width="100%"
      >
        {connectors.map((connector) => (
          <path
            className={[
              styles.connectionsPath,
              connectorFocusClassNames[connector.focusState],
            ].join(" ")}
            d={connector.path}
            key={connector.id}
            stroke={connector.color}
          />
        ))}
      </svg>

      {visibleNodeIds.map((nodeId) => {
        const node = mindMap.nodes[nodeId];
        const position = stagePositions[nodeId];
        const colorStyle = NODE_COLORS[node.color];
        const isSelected = hasActiveSelection && nodeId === selectedNodeId;
        const isMatched = searchMatchIds.has(nodeId);
        const isDragging = draggingNodeId === nodeId;
        const focusState = nodeFocusStates[nodeId] ?? "dimmed";

        return (
          <article
            className={[
              styles.mindNode,
              nodeFocusClassNames[focusState],
              isSelected ? styles.mindNodeSelected : "",
              isMatched ? styles.mindNodeMatched : "",
              isDragging ? styles.mindNodeDragging : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={node.id}
            onClick={(event) => {
              event.stopPropagation();
              onNodeSelect(node.id);
            }}
            onContextMenu={(event) => onNodeContextMenu(node.id, event)}
            onPointerDown={(event) => onNodePointerDown(node.id, event)}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              background: colorStyle.surface,
              ...(isSelected
                ? { boxShadow: `0 24px 54px ${colorStyle.glow}` }
                : {}),
            }}
          >
            <div className={styles.mindNodeContent}>
              <h3>{node.title || "Untitled Node"}</h3>
              {node.notes ? (
                <p className={styles.mindNodeNotes}>
                  {truncateText(node.notes, 88)}
                </p>
              ) : null}
            </div>

            {node.childrenIds.length > 0 ? (
              <button
                aria-label={node.collapsed ? "Expand node" : "Collapse node"}
                className={[
                  styles.mindNodeToggle,
                  node.collapsed ? styles.mindNodeToggleCollapsed : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleCollapsed(node.id);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                type="button"
              >
                <span className={styles.mindNodeToggleIcon}>
                  {node.collapsed ? "+" : "-"}
                </span>
                <span className={styles.mindNodeBadge}>{node.childrenIds.length}</span>
              </button>
            ) : null}
          </article>
        );
      })}

      {children}
    </div>
  );
}
