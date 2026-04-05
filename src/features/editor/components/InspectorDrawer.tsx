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
      onWheel={(event) => event.stopPropagation()}
    >
      <div
        className={[
          drawerStyles.floatingPanel,
          drawerStyles.floatingPanelInspector,
        ].join(" ")}
      >
        <div className={drawerStyles.floatingPanelSection}>
          <div className={drawerStyles.panelHeader}>
            <h2>Inspector</h2>
            <span>{selectedNode.parentId === null ? "Root" : "Selected"}</span>
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
                  style={{ background: colorValue.surface }}
                  type="button"
                >
                  <span>{colorValue.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className={[
            drawerStyles.floatingPanelSection,
            drawerStyles.floatingPanelSectionMeta,
          ].join(" ")}
        >
          <div className={styles.shortcutStrip}>
            <span>Tab: child</span>
            <span>Enter: sibling</span>
            <span>Delete: remove</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
