import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  LOGIC_CHART_LINE_LAYOUT,
  MINDMAP_LINE_LAYOUT,
  NODE_COLORS,
} from "../../../domain/mindmap/model";
import { getNodeHeightForLayout } from "../../../domain/mindmap/layout";
import { getBranchDirection } from "../../../domain/mindmap/treeQueries";
import type {
  MindMapDocument,
  MindMapLayoutType,
  MindMapNode,
} from "../../../domain/mindmap/model";
import { joinClassNames } from "../../../shared/classNames";
import type { NodeFocusState, Position } from "../types";
import baseStyles from "./CanvasNodeBase.module.css";
import organicStyles from "./CanvasNodeOrganic.module.css";
import { CanvasNodeContent } from "./CanvasNodeContent";

type CanvasStageNodeProps = {
  cameraScale: number;
  focusState: NodeFocusState;
  isDragging: boolean;
  isMatched: boolean;
  isReparentTarget: boolean;
  isSelected: boolean;
  layoutType: MindMapLayoutType;
  node: MindMapNode;
  document: MindMapDocument;
  onNodeConnectorPointerDown: (
    nodeId: string,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  onNodeContextMenu: (
    nodeId: string,
    event: ReactMouseEvent<HTMLElement>,
  ) => void;
  onNodeImageView: (nodeId: string) => void;
  onNodePointerDown: (
    nodeId: string,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  onNodeSelect: (nodeId: string) => void;
  onToggleCollapsed: (nodeId: string) => void;
  position: Position;
};

const nodeFocusClassNames: Record<NodeFocusState, string> = {
  selected: baseStyles.mindNodeFocusSelected,
  lineage: baseStyles.mindNodeFocusLineage,
  descendant: baseStyles.mindNodeFocusDescendant,
  dimmed: baseStyles.mindNodeFocusDimmed,
};

export function CanvasStageNode({
  cameraScale,
  focusState,
  isDragging,
  isMatched,
  isReparentTarget,
  isSelected,
  layoutType,
  node,
  document,
  onNodeConnectorPointerDown,
  onNodeContextMenu,
  onNodeImageView,
  onNodePointerDown,
  onNodeSelect,
  onToggleCollapsed,
  position,
}: CanvasStageNodeProps) {
  const colorStyle = NODE_COLORS[node.color];
  const isLogicChartLine = layoutType === LOGIC_CHART_LINE_LAYOUT;
  const isMindMapLine = layoutType === MINDMAP_LINE_LAYOUT;
  const isLineLayout = isLogicChartLine || isMindMapLine;
  const branchDirection =
    node.parentId === null ? 1 : getBranchDirection(document, node.id);
  const isMindMapLineLeft =
    isMindMapLine && node.parentId !== null && branchDirection === -1;
  const nodeHeight = getNodeHeightForLayout(layoutType, node);

  const nodeStyle = isLineLayout
    ? ({
        left: `${position.x}px`,
        top: `${position.y}px`,
        height: `${nodeHeight}px`,
        minHeight: `${nodeHeight}px`,
        "--node-scale": cameraScale.toString(),
        "--organic-accent": colorStyle.accent,
        "--organic-accent-strong": withAlpha(colorStyle.accent, 0.28),
        "--organic-accent-soft": withAlpha(colorStyle.accent, 0.16),
        "--organic-accent-border": withAlpha(colorStyle.accent, 0.34),
        "--organic-glow": colorStyle.glow,
        "--organic-link": colorStyle.accent,
      } as CSSProperties)
    : ({
        left: `${position.x}px`,
        top: `${position.y}px`,
        height: `${nodeHeight}px`,
        minHeight: `${nodeHeight}px`,
        "--node-scale": cameraScale.toString(),
        background: colorStyle.surface,
        ...(isSelected ? { boxShadow: `0 24px 54px ${colorStyle.glow}` } : {}),
      } as CSSProperties);

  return (
    <article
      className={joinClassNames(
        baseStyles.mindNode,
        isLineLayout && organicStyles.mindNodeOrganic,
        isLineLayout && node.parentId === null && organicStyles.mindNodeOrganicRoot,
        isMindMapLine && organicStyles.mindNodeClassicLine,
        isMindMapLineLeft && organicStyles.mindNodeClassicLineLeft,
        isMindMapLine && node.parentId === null && organicStyles.mindNodeClassicLineRoot,
        nodeFocusClassNames[focusState],
        isSelected && baseStyles.mindNodeSelected,
        isSelected && isLineLayout && organicStyles.mindNodeOrganicSelected,
        isMatched && baseStyles.mindNodeMatched,
        isMatched && isLineLayout && organicStyles.mindNodeOrganicMatched,
        isDragging && baseStyles.mindNodeDragging,
        isReparentTarget && baseStyles.mindNodeReparentTarget,
      )}
      data-node-id={node.id}
      onClick={(event) => {
        event.stopPropagation();
        onNodeSelect(node.id);
      }}
      onContextMenu={(event) => onNodeContextMenu(node.id, event)}
      onPointerDown={(event) => onNodePointerDown(node.id, event)}
      style={nodeStyle}
    >
      <CanvasNodeContent
        isLineLayout={isLineLayout}
        isMindMapLine={isMindMapLine}
        isMindMapLineLeft={isMindMapLineLeft}
        isSelected={isSelected}
        node={node}
        onNodeImageView={onNodeImageView}
      />

      {node.parentId !== null ? (
        <button
          aria-label="Change parent"
          className={joinClassNames(
            baseStyles.connectorHandle,
            branchDirection === -1 && baseStyles.connectorHandleLeft,
          )}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => onNodeConnectorPointerDown(node.id, event)}
          type="button"
        >
          <span className={baseStyles.connectorHandleDot} />
        </button>
      ) : null}

      {node.childrenIds.length > 0 ? (
        <button
          aria-label={node.collapsed ? "Expand node" : "Collapse node"}
          className={joinClassNames(
            baseStyles.mindNodeToggle,
            isLineLayout && organicStyles.mindNodeToggleOrganic,
            isMindMapLineLeft && organicStyles.mindNodeToggleOrganicLeft,
            node.collapsed && baseStyles.mindNodeToggleCollapsed,
          )}
          onClick={(event) => {
            event.stopPropagation();
            onToggleCollapsed(node.id);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          <span
            className={joinClassNames(
              baseStyles.mindNodeToggleIcon,
              isLineLayout && baseStyles.mindNodeToggleIconOrganic,
            )}
          >
            {node.collapsed ? "+" : "-"}
          </span>
          <span
            className={joinClassNames(
              baseStyles.mindNodeBadge,
              isLineLayout && baseStyles.mindNodeBadgeOrganic,
            )}
          >
            {node.childrenIds.length}
          </span>
        </button>
      ) : null}
    </article>
  );
}

function withAlpha(hexColor: string, alpha: number): string {
  const normalizedHex = hexColor.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalizedHex)) {
    return hexColor;
  }

  const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
