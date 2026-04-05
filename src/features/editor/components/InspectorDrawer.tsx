import { NODE_COLORS, type MindMapNode, type NodeColor } from "../../../mindmap";
import drawerStyles from "./EditorDrawer.module.css";
import styles from "./InspectorDrawer.module.css";

type InspectorDrawerProps = {
  isOpen: boolean;
  onNodeColorChange: (color: NodeColor) => void;
  onNodeNotesChange: (value: string) => void;
  onNodeTitleChange: (value: string) => void;
  selectedNode: MindMapNode;
};

export function InspectorDrawer({
  isOpen,
  onNodeColorChange,
  onNodeNotesChange,
  onNodeTitleChange,
  selectedNode,
}: InspectorDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className={[
        drawerStyles.canvasDrawer,
        drawerStyles.canvasDrawerRight,
        drawerStyles.isOpen,
      ].join(" ")}
      data-native-scroll="true"
      onWheel={(event) => event.stopPropagation()}
    >
      <div
        className={[
          drawerStyles.floatingPanel,
          drawerStyles.floatingPanelInspector,
        ].join(" ")}
      >
        <div className={styles.inspectorHeader}>
          <h2>Inspector</h2>
          <p>{selectedNode.parentId === null ? "Root node" : "Selected node"}</p>
        </div>

        <label className={styles.field}>
          <span>Title</span>
          <input
            onChange={(event) => onNodeTitleChange(event.currentTarget.value)}
            value={selectedNode.title}
          />
        </label>

        <label className={styles.field}>
          <span>Notes</span>
          <textarea
            onChange={(event) => onNodeNotesChange(event.currentTarget.value)}
            placeholder="Optional context"
            rows={5}
            value={selectedNode.notes}
          />
        </label>

        <div className={styles.field}>
          <span>Color</span>
          <div className={styles.colorGrid}>
            {(Object.entries(NODE_COLORS) as [
              NodeColor,
              (typeof NODE_COLORS)[NodeColor],
            ][]).map(([colorKey, colorValue]) => (
              <button
                aria-label={colorValue.label}
                className={[
                  styles.colorChip,
                  selectedNode.color === colorKey ? styles.colorChipActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={colorKey}
                onClick={() => onNodeColorChange(colorKey)}
                type="button"
              >
                <span
                  className={styles.colorChipSwatch}
                  style={{
                    background: colorValue.accent,
                    boxShadow: `0 0 0 6px ${colorValue.glow}`,
                  }}
                />
                <span>{colorValue.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={drawerStyles.panelDivider} />

        <p className={styles.shortcutHint}>
          Tab adds a child, Enter adds a sibling, and Delete removes the node.
        </p>
      </div>
    </aside>
  );
}
