import { Suspense, lazy } from "react";
import type { EmojiClickData } from "emoji-picker-react";
import {
  MINDMAP_NODE_KINDS,
  MINDMAP_NODE_KIND_LABELS,
  NODE_COLORS,
  getMindMapNodeLinkUrl,
  getMindMapNodeMediaUrl,
  type MindMapNode,
  type MindMapNodeKind,
  type NodeColor,
} from "../../../mindmap";
import drawerStyles from "./EditorDrawer.module.css";
import styles from "./InspectorDrawer.module.css";

const EmojiPickerPanel = lazy(async () => {
  const emojiPickerModule = await import("emoji-picker-react");
  const EmojiPicker = emojiPickerModule.default;

  return {
    default: function EmojiPickerPanel({
      onEmojiClick,
    }: {
      onEmojiClick: (emojiData: EmojiClickData) => void;
    }) {
      return (
        <EmojiPicker
          autoFocusSearch={false}
          emojiStyle={emojiPickerModule.EmojiStyle.NATIVE}
          height={380}
          lazyLoadEmojis
          onEmojiClick={onEmojiClick}
          previewConfig={{ showPreview: false }}
          searchPlaceholder="Search emoji"
          theme={emojiPickerModule.Theme.DARK}
          width="100%"
        />
      );
    },
  };
});

type InspectorDrawerProps = {
  isOpen: boolean;
  onNodeColorChange: (color: NodeColor) => void;
  onNodeEmojiChange: (value: string) => void;
  onNodeImageUrlChange: (value: string) => void;
  onNodeKindChange: (kind: MindMapNodeKind) => void;
  onNodeLinkUrlChange: (value: string) => void;
  onNodeNotesChange: (value: string) => void;
  onNodeTitleChange: (value: string) => void;
  selectedNode: MindMapNode;
};

export function InspectorDrawer({
  isOpen,
  onNodeColorChange,
  onNodeEmojiChange,
  onNodeImageUrlChange,
  onNodeKindChange,
  onNodeLinkUrlChange,
  onNodeNotesChange,
  onNodeTitleChange,
  selectedNode,
}: InspectorDrawerProps) {
  if (!isOpen) {
    return null;
  }

  const mediaUrl = getMindMapNodeMediaUrl(selectedNode);
  const linkUrl = getMindMapNodeLinkUrl(selectedNode);
  const handleEmojiPickerSelect = (emojiData: EmojiClickData) => {
    onNodeEmojiChange(emojiData.emoji);
  };

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
          <span>Node type</span>
          <select
            onChange={(event) =>
              onNodeKindChange(event.currentTarget.value as MindMapNodeKind)
            }
            value={selectedNode.kind}
          >
            {MINDMAP_NODE_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {MINDMAP_NODE_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
          <small className={styles.fieldHint}>
            Switch between text, image, link, and emoji nodes.
          </small>
        </label>

        <label className={styles.field}>
          <span>Title</span>
          <input
            onChange={(event) => onNodeTitleChange(event.currentTarget.value)}
            placeholder="Optional display title"
            value={selectedNode.title}
          />
        </label>

        {selectedNode.kind === "image" ? (
          <label className={styles.field}>
            <span>Image URL</span>
            <input
              onChange={(event) => onNodeImageUrlChange(event.currentTarget.value)}
              placeholder="https://example.com/image.png"
              value={mediaUrl}
            />
            <small className={styles.fieldHint}>
              Paste a hosted image or a local app asset path.
            </small>
          </label>
        ) : null}

        {selectedNode.kind === "link" ? (
          <label className={styles.field}>
            <span>Link URL</span>
            <input
              onChange={(event) => onNodeLinkUrlChange(event.currentTarget.value)}
              placeholder="https://example.com"
              value={linkUrl}
            />
            <small className={styles.fieldHint}>
              Clicking the node will open this address in a new tab.
            </small>
          </label>
        ) : null}

        {selectedNode.kind === "emoji" ? (
          <div className={styles.field}>
            <span>Emoji</span>
            <div className={styles.emojiPickerWidget}>
              <Suspense
                fallback={
                  <div
                    aria-live="polite"
                    className={styles.emojiPickerLoading}
                    role="status"
                  >
                    Loading emoji library...
                  </div>
                }
              >
                <EmojiPickerPanel onEmojiClick={handleEmojiPickerSelect} />
              </Suspense>
            </div>
          </div>
        ) : null}

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
          Tab adds a child, Enter adds a sibling, Cmd/Ctrl+D duplicates, and
          Delete removes the node.
        </p>
      </div>
    </aside>
  );
}
