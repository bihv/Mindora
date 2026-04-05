import type { MindMapNode } from "../../../mindmap";
import styles from "./NodeContextMenu.module.css";

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
      className={styles.nodeContextToolbar}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        left: `${left}px`,
        top: `${top}px`,
      }}
    >
      <button
        className={styles.nodeContextButton}
        onClick={onAddChild}
        type="button"
      >
        Child
      </button>
      {selectedNode.parentId !== null ? (
        <button
          className={styles.nodeContextButton}
          onClick={onAddSibling}
          type="button"
        >
          Sibling
        </button>
      ) : null}
      {selectedNode.childrenIds.length > 0 ? (
        <button
          className={styles.nodeContextButton}
          onClick={onToggleCollapsed}
          type="button"
        >
          {selectedNode.collapsed ? "Expand" : "Collapse"}
        </button>
      ) : null}
      {selectedNode.parentId !== null ? (
        <button
          className={[styles.nodeContextButton, styles.nodeContextButtonDanger].join(
            " ",
          )}
          onClick={onDelete}
          type="button"
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}
