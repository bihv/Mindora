import type { ReactNode } from "react";
import { NODE_COLORS, type MindMapDocument } from "../../../mindmap";

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
          className={`outline-item${
            hasActiveSelection && nodeId === selectedNodeId
              ? " outline-item--selected"
              : ""
          }${searchMatchIds.has(nodeId) ? " outline-item--matched" : ""}`}
          onClick={() => onSelectNode(nodeId)}
          style={{ paddingLeft: `${16 + depth * 18}px` }}
          type="button"
        >
          <span
            className="outline-item__dot"
            style={{ background: NODE_COLORS[node.color].accent }}
          />
          <span className="outline-item__title">{node.title || "Untitled Node"}</span>
          {node.childrenIds.length > 0 ? (
            <span className="outline-item__count">{node.childrenIds.length}</span>
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
      className={`canvas-drawer canvas-drawer--left${isOpen ? " is-open" : ""}`}
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="floating-panel">
        <div className="floating-panel__section">
          <div className="panel__header">
            <h2>Map</h2>
            <span>{totalNodes} node(s)</span>
          </div>
          <label className="search-field">
            <span className="search-field__label">Search</span>
            <input
              onChange={(event) => onSearchQueryChange(event.currentTarget.value)}
              placeholder="Search nodes"
              value={searchQuery}
            />
          </label>
        </div>

        <div className="floating-panel__section floating-panel__section--grow">
          <div className="panel__header">
            <h2>Outline</h2>
            <span>Focus tree</span>
          </div>
          <div className="outline-tree">
            {searchQuery.trim() && searchMatchesCount === 0 ? (
              <p className="empty-state">No matching node in the current map.</p>
            ) : (
              renderOutlineTree(mindMap.rootId)
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
