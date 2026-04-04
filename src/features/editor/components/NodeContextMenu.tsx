import type { MindMapNode } from "../../../mindmap";

type NodeContextMenuProps = {
  isVisible: boolean;
  left: number;
  onAddChild: () => void;
  onAddSibling: () => void;
  onDelete: () => void;
  onToggleCollapsed: () => void;
  selectedNode: MindMapNode;
  top: number;
};

export function NodeContextMenu({
  isVisible,
  left,
  onAddChild,
  onAddSibling,
  onDelete,
  onToggleCollapsed,
  selectedNode,
  top,
}: NodeContextMenuProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="node-context-toolbar"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        left: `${left}px`,
        top: `${top}px`,
      }}
    >
      <button
        className="node-context-button"
        onClick={onAddChild}
        type="button"
      >
        Child
      </button>
      {selectedNode.parentId !== null ? (
        <button
          className="node-context-button"
          onClick={onAddSibling}
          type="button"
        >
          Sibling
        </button>
      ) : null}
      {selectedNode.childrenIds.length > 0 ? (
        <button
          className="node-context-button"
          onClick={onToggleCollapsed}
          type="button"
        >
          {selectedNode.collapsed ? "Expand" : "Collapse"}
        </button>
      ) : null}
      {selectedNode.parentId !== null ? (
        <button
          className="node-context-button node-context-button--danger"
          onClick={onDelete}
          type="button"
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}
