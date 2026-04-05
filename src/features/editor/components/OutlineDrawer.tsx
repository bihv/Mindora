import type { ReactNode } from "react";
import { NODE_COLORS, type MindMapDocument } from "../../../mindmap";
import drawerStyles from "./EditorDrawer.module.css";
import styles from "./OutlineDrawer.module.css";

type OutlineDrawerProps = {
  hasActiveSelection: boolean;
  isOpen: boolean;
  mindMap: MindMapDocument;
  onSearchQueryChange: (value: string) => void;
  onSelectNode: (nodeId: string) => void;
  outlineSearchVisibleSet: Set<string> | null;
  searchMatchIds: Set<string>;
  searchMatchesCount: number;
  searchQuery: string;
  selectedNodeId: string;
  totalNodes: number;
};

export function OutlineDrawer({
  hasActiveSelection,
  isOpen,
  mindMap,
  onSearchQueryChange,
  onSelectNode,
  outlineSearchVisibleSet,
  searchMatchIds,
  searchMatchesCount,
  searchQuery,
  selectedNodeId,
  totalNodes,
}: OutlineDrawerProps) {
  const renderOutlineTree = (nodeId: string, depth = 0): ReactNode => {
    const node = mindMap.nodes[nodeId];
    if (!node) {
      return null;
    }

    if (outlineSearchVisibleSet && !outlineSearchVisibleSet.has(nodeId)) {
      return null;
    }

    const showOutlineChildren =
      outlineSearchVisibleSet !== null || !node.collapsed;
    const visibleChildIds = outlineSearchVisibleSet
      ? node.childrenIds.filter((childId) => outlineSearchVisibleSet.has(childId))
      : node.childrenIds;

    return (
      <div key={nodeId}>
        <button
          className={[
            styles.outlineItem,
            hasActiveSelection && nodeId === selectedNodeId
              ? styles.outlineItemSelected
              : "",
            searchMatchIds.has(nodeId) ? styles.outlineItemMatched : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onSelectNode(nodeId)}
          style={{ paddingLeft: `${16 + depth * 18}px` }}
          type="button"
        >
          <span
            className={styles.outlineItemDot}
            style={{ background: NODE_COLORS[node.color].accent }}
          />
          <span className={styles.outlineItemTitle}>
            {node.title || "Untitled Node"}
          </span>
          {node.childrenIds.length > 0 ? (
            <span className={styles.outlineItemCount}>
              {node.childrenIds.length}
            </span>
          ) : null}
        </button>

        {showOutlineChildren
          ? visibleChildIds.map((childId) => renderOutlineTree(childId, depth + 1))
          : null}
      </div>
    );
  };

  return (
    <aside
      className={[
        drawerStyles.canvasDrawer,
        drawerStyles.canvasDrawerLeft,
        isOpen ? drawerStyles.isOpen : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onWheel={(event) => event.stopPropagation()}
    >
      <div className={drawerStyles.floatingPanel}>
        <div className={drawerStyles.floatingPanelSection}>
          <div className={drawerStyles.panelHeader}>
            <h2>Map</h2>
            <span>{totalNodes} node(s)</span>
          </div>
          <label className={styles.searchField}>
            <span className={styles.searchFieldLabel}>Search</span>
            <input
              onChange={(event) => onSearchQueryChange(event.currentTarget.value)}
              placeholder="Search nodes"
              value={searchQuery}
            />
          </label>
        </div>

        <div
          className={[
            drawerStyles.floatingPanelSection,
            drawerStyles.floatingPanelSectionGrow,
          ].join(" ")}
        >
          <div className={drawerStyles.panelHeader}>
            <h2>Outline</h2>
            <span>Focus tree</span>
          </div>
          <div className={styles.outlineTree}>
            {searchQuery.trim() && searchMatchesCount === 0 ? (
              <p className={styles.emptyState}>
                No matching node in the current map.
              </p>
            ) : (
              renderOutlineTree(mindMap.rootId)
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
