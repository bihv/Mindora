import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import {
  LOGIC_CHART_LINE_LAYOUT,
  MINDMAP_LINE_LAYOUT,
  MINDMAP_NODE_KIND_LABELS,
  NODE_COLORS,
  getBranchDirection,
  getMindMapNodeDetailText,
  getMindMapNodeDisplayTitle,
  getMindMapNodeEmoji,
  getMindMapNodeLineTitle,
  getMindMapNodeLinkUrl,
  getMindMapNodeMediaUrl,
  getNodeHeightForLayout,
  isLogicChartLayoutType,
  normalizeExternalUrl,
  type MindMapDocument,
  type MindMapLayoutType,
  type MindMapNode,
} from "../../../mindmap";
import {
  getCanvasBackgroundStyle,
  type MindMapBackgroundPresetId,
} from "../backgroundPresets";
import styles from "./CanvasStage.module.css";
import { openExternalUrl, truncateText } from "../utils";
import type {
  CameraState,
  ConnectorItem,
  ConnectorPreviewItem,
  NodeFocusState,
  Position,
} from "../types";

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

function handleExternalLinkClick(
  event: ReactMouseEvent<HTMLAnchorElement>,
  url: string,
): void {
  event.preventDefault();
  event.stopPropagation();
  void openExternalUrl(url);
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

function renderLineNodeDetail(
  node: MindMapNode,
  options: {
    isMindMapLineLeft: boolean;
  },
): ReactNode {
  const isReverse = options.isMindMapLineLeft && node.parentId !== null;
  const isRoot = node.parentId === null;
  const detailText = truncateText(getMindMapNodeDetailText(node), 56);
  const rowClassName = [
    styles.mindNodeOrganicMetaRow,
    isReverse ? styles.mindNodeOrganicMetaRowReverse : "",
    isRoot ? styles.mindNodeOrganicMetaRowCenter : "",
  ]
    .filter(Boolean)
    .join(" ");
  const detailClassName = [
    styles.mindNodeOrganicDetail,
    isReverse ? styles.mindNodeOrganicDetailAlignEnd : "",
    isRoot ? styles.mindNodeOrganicDetailCenter : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (node.kind === "text") {
    if (!detailText) {
      return null;
    }

    return <p className={detailClassName}>{detailText}</p>;
  }

  if (node.kind === "image") {
    const mediaUrl = getMindMapNodeMediaUrl(node);

    return (
      <div className={rowClassName}>
        <div className={styles.mindNodeOrganicMediaChip}>
          {mediaUrl ? (
            <img
              alt={getMindMapNodeDisplayTitle(node)}
              className={styles.mindNodeOrganicMediaImage}
              draggable={false}
              src={mediaUrl}
            />
          ) : (
            <span>IMG</span>
          )}
        </div>
        <p className={detailClassName}>{detailText}</p>
      </div>
    );
  }

  if (node.kind === "link") {
    const linkHref = normalizeExternalUrl(getMindMapNodeLinkUrl(node));

    return (
      <div className={rowClassName}>
        <span className={styles.mindNodeOrganicKindTag}>
          {MINDMAP_NODE_KIND_LABELS.link}
        </span>
        <p className={detailClassName}>{detailText}</p>
        {linkHref ? (
          <a
            className={styles.mindNodeOrganicLink}
            href={linkHref}
            onClick={(event) => handleExternalLinkClick(event, linkHref)}
            onPointerDown={(event) => event.stopPropagation()}
            rel="noreferrer noopener"
            target="_blank"
          >
            Open
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className={rowClassName}>
      <div className={styles.mindNodeOrganicEmojiChip}>
        {getMindMapNodeEmoji(node) || ":)"}
      </div>
      <p className={detailClassName}>{detailText}</p>
    </div>
  );
}

function renderNodeContent(
  node: MindMapNode,
  options: {
    isLineLayout: boolean;
    isMindMapLine: boolean;
    isMindMapLineLeft: boolean;
  },
): ReactNode {
  const { isLineLayout, isMindMapLine, isMindMapLineLeft } = options;
  const title = getMindMapNodeDisplayTitle(node);

  if (isLineLayout) {
    const lineNodeDetail = renderLineNodeDetail(node, { isMindMapLineLeft });

    return (
      <div
        className={[
          styles.mindNodeContent,
          styles.mindNodeOrganicContent,
        ].join(" ")}
      >
        <div
          className={[
            styles.mindNodeOrganicTitleRow,
            isMindMapLineLeft ? styles.mindNodeOrganicTitleRowReverse : "",
            isMindMapLine && node.parentId === null
              ? styles.mindNodeClassicLineRootTitleRow
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <h3>{getMindMapNodeLineTitle(node)}</h3>
          {node.parentId !== null ? (
            <span
              aria-hidden="true"
              className={styles.mindNodeOrganicRule}
            />
          ) : null}
        </div>
        {lineNodeDetail}
      </div>
    );
  }

  if (node.kind === "text") {
    return (
      <div className={styles.mindNodeContent}>
        <h3 className={styles.mindNodeCompactTitle}>{title}</h3>
        {node.notes ? (
          <p className={styles.mindNodeNotes}>
            {truncateText(node.notes, 88)}
          </p>
        ) : null}
      </div>
    );
  }

  if (node.kind === "image") {
    const mediaUrl = getMindMapNodeMediaUrl(node);
    const detail = truncateText(
      getMindMapNodeDetailText(node),
      78,
    );

    return (
      <div className={styles.mindNodeContent}>
        <div className={styles.mindNodeRichRow}>
          <div className={styles.mindNodeMediaPreview}>
            {mediaUrl ? (
              <img
                alt={title}
                className={styles.mindNodeMediaImage}
                draggable={false}
                src={mediaUrl}
              />
            ) : (
              <span>{MINDMAP_NODE_KIND_LABELS.image}</span>
            )}
          </div>
          <div className={styles.mindNodeRichMeta}>
            <h3 className={styles.mindNodeCompactTitle}>{title}</h3>
            <p className={styles.mindNodeDetail}>{detail}</p>
          </div>
        </div>
      </div>
    );
  }

  if (node.kind === "link") {
    const linkUrl = getMindMapNodeLinkUrl(node);
    const linkHref = normalizeExternalUrl(linkUrl);
    const detail = truncateText(
      getMindMapNodeDetailText(node),
      78,
    );

    return (
      <div className={styles.mindNodeContent}>
        <div className={styles.mindNodeRichMeta}>
          <h3 className={styles.mindNodeCompactTitle}>{title}</h3>
          <p className={styles.mindNodeDetail}>{detail}</p>
          {linkHref ? (
            <a
              className={styles.mindNodeLinkButton}
              href={linkHref}
              onClick={(event) => handleExternalLinkClick(event, linkHref)}
              onPointerDown={(event) => event.stopPropagation()}
              rel="noreferrer noopener"
              target="_blank"
            >
              Open link
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  const emoji = getMindMapNodeEmoji(node) || ":)";
  const emojiDetail = truncateText(getMindMapNodeDetailText(node), 78);

  return (
    <div className={styles.mindNodeContent}>
      <div className={styles.mindNodeRichRow}>
        <div className={styles.mindNodeEmojiBadge}>{emoji}</div>
        <div className={styles.mindNodeRichMeta}>
          <h3 className={styles.mindNodeCompactTitle}>{title}</h3>
          <p className={styles.mindNodeDetail}>{emojiDetail}</p>
        </div>
      </div>
    </div>
  );
}

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
  const canvasBackgroundStyle = getCanvasBackgroundStyle(
    backgroundPresetId,
    camera,
  );

  return (
    <div
      className={[
        styles.canvasStage,
        isLogicChartLayoutType(layoutType) ? styles.canvasStageOrganic : "",
        panning ? styles.canvasStagePanning : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-canvas-stage="true"
      onClick={onCanvasClick}
      onPointerDown={onStagePointerDown}
      style={canvasBackgroundStyle}
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
        {previewConnector ? (
          <path
            className={[
              styles.connectionsPath,
              styles.connectionsPathPreview,
              previewConnector.isSnapped ? styles.connectionsPathPreviewSnapped : "",
            ]
              .filter(Boolean)
              .join(" ")}
            d={previewConnector.path}
            stroke={previewConnector.color}
          />
        ) : null}
      </svg>

      {visibleNodeIds.map((nodeId) => {
        const node = mindMap.nodes[nodeId];
        const position = stagePositions[nodeId];
        const colorStyle = NODE_COLORS[node.color];
        const isSelected = hasActiveSelection && nodeId === selectedNodeId;
        const isMatched = searchMatchIds.has(nodeId);
        const isDragging = draggingNodeId === nodeId;
        const focusState = nodeFocusStates[nodeId] ?? "dimmed";
        const isLogicChartLine = layoutType === LOGIC_CHART_LINE_LAYOUT;
        const isMindMapLine = layoutType === MINDMAP_LINE_LAYOUT;
        const isLineLayout = isLogicChartLine || isMindMapLine;
        const branchDirection =
          node.parentId === null ? 1 : getBranchDirection(mindMap, nodeId);
        const isMindMapLineLeft =
          isMindMapLine && node.parentId !== null && branchDirection === -1;
        const nodeHeight = getNodeHeightForLayout(layoutType, node);
        const nodeStyle = isLineLayout
          ? ({
              left: `${position.x}px`,
              top: `${position.y}px`,
              height: `${nodeHeight}px`,
              minHeight: `${nodeHeight}px`,
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
              background: colorStyle.surface,
              ...(isSelected
                ? { boxShadow: `0 24px 54px ${colorStyle.glow}` }
                : {}),
            } as CSSProperties);

        return (
          <article
            className={[
              styles.mindNode,
              isLineLayout ? styles.mindNodeOrganic : "",
              isLineLayout && node.parentId === null ? styles.mindNodeOrganicRoot : "",
              isMindMapLine ? styles.mindNodeClassicLine : "",
              isMindMapLineLeft ? styles.mindNodeClassicLineLeft : "",
              isMindMapLine && node.parentId === null
                ? styles.mindNodeClassicLineRoot
                : "",
              nodeFocusClassNames[focusState],
              isSelected ? styles.mindNodeSelected : "",
              isMatched ? styles.mindNodeMatched : "",
              isDragging ? styles.mindNodeDragging : "",
              reparentTargetNodeId === node.id ? styles.mindNodeReparentTarget : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-node-id={node.id}
            key={node.id}
            onClick={(event) => {
              event.stopPropagation();
              onNodeSelect(node.id);
            }}
            onContextMenu={(event) => onNodeContextMenu(node.id, event)}
            onPointerDown={(event) => onNodePointerDown(node.id, event)}
            style={nodeStyle}
          >
            {renderNodeContent(node, {
              isLineLayout,
              isMindMapLine,
              isMindMapLineLeft,
            })}

            {node.parentId !== null ? (
              <button
                aria-label="Change parent"
                className={[
                  styles.connectorHandle,
                  branchDirection === -1 ? styles.connectorHandleLeft : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => onNodeConnectorPointerDown(node.id, event)}
                type="button"
              >
                <span className={styles.connectorHandleDot} />
              </button>
            ) : null}

            {node.childrenIds.length > 0 ? (
              <button
                aria-label={node.collapsed ? "Expand node" : "Collapse node"}
                className={[
                  styles.mindNodeToggle,
                  isLineLayout ? styles.mindNodeToggleOrganic : "",
                  isMindMapLineLeft ? styles.mindNodeToggleOrganicLeft : "",
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
