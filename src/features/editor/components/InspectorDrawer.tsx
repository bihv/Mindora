import { NODE_COLORS, type MindMapNode, type NodeColor } from "../../../mindmap";

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
      className="canvas-drawer canvas-drawer--right is-open"
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="floating-panel floating-panel--inspector">
        <div className="floating-panel__section">
          <div className="panel__header">
            <h2>Inspector</h2>
            <span>{selectedNode.parentId === null ? "Root" : "Selected"}</span>
          </div>

          <label className="field">
            <span>Title</span>
            <input
              onChange={(event) => onNodeTitleChange(event.currentTarget.value)}
              value={selectedNode.title}
            />
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea
              onChange={(event) => onNodeNotesChange(event.currentTarget.value)}
              placeholder="Optional context"
              rows={5}
              value={selectedNode.notes}
            />
          </label>

          <div className="field">
            <span>Color</span>
            <div className="color-grid">
              {(Object.entries(NODE_COLORS) as [
                NodeColor,
                (typeof NODE_COLORS)[NodeColor],
              ][]).map(([colorKey, colorValue]) => (
                <button
                  aria-label={colorValue.label}
                  className={`color-chip${
                    selectedNode.color === colorKey ? " color-chip--active" : ""
                  }`}
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

        <div className="floating-panel__section floating-panel__section--meta">
          <div className="shortcut-strip">
            <span>Tab: child</span>
            <span>Enter: sibling</span>
            <span>Delete: remove</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
