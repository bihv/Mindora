import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import {
  LOGIC_CHART_LINE_LAYOUT,
  NODE_COLORS,
  type MindMapDocument,
  type MindMapLayoutType,
} from "../../../mindmap";
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
  layoutType: MindMapLayoutType;
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
  layoutType,
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
        layoutType === LOGIC_CHART_LINE_LAYOUT ? styles.canvasStageOrganic : "",
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
        const isLogicChart = layoutType === LOGIC_CHART_LINE_LAYOUT;
        const nodeStyle = isLogicChart
          ? ({
              left: `${position.x}px`,
              top: `${position.y}px`,
              "--organic-accent": colorStyle.accent,
              "--organic-glow": colorStyle.glow,
            } as CSSProperties)
          : ({
              left: `${position.x}px`,
              top: `${position.y}px`,
              background: colorStyle.surface,
              ...(isSelected
                ? { boxShadow: `0 24px 54px ${colorStyle.glow}` }
                : {}),
            } as CSSProperties);

        return (
          <article
            className={[
              styles.mindNode,
              isLogicChart ? styles.mindNodeOrganic : "",
              isLogicChart && node.parentId === null ? styles.mindNodeOrganicRoot : "",
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
            style={nodeStyle}
          >
            <div className={styles.mindNodeContent}>
              {isLogicChart ? (
                <div className={styles.mindNodeOrganicTitleRow}>
                  <h3>{node.title || "Untitled Node"}</h3>
                  {node.parentId !== null ? (
                    <span
                      aria-hidden="true"
                      className={styles.mindNodeOrganicRule}
                    />
                  ) : null}
                </div>
              ) : (
                <>
                  <h3>{node.title || "Untitled Node"}</h3>
                  {node.notes ? (
                    <p className={styles.mindNodeNotes}>
                      {truncateText(node.notes, 88)}
                    </p>
                  ) : null}
                </>
              )}
            </div>

            {node.childrenIds.length > 0 ? (
              <button
                aria-label={node.collapsed ? "Expand node" : "Collapse node"}
                className={[
                  styles.mindNodeToggle,
                  isLogicChart ? styles.mindNodeToggleOrganic : "",
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
