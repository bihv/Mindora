import { getMindMapNodeLinkUrl } from "../../../domain/mindmap/nodeContent";
import type {
  MindMapNode,
  MindMapNodeKind,
  NodeColor,
} from "../../../domain/mindmap/model";
import drawerStyles from "./EditorDrawer.module.css";
import styles from "./InspectorDrawer.module.css";
import { InspectorBasicsSection } from "./inspector/InspectorBasicsSection";
import { InspectorColorSection } from "./inspector/InspectorColorSection";
import { InspectorEmojiSection } from "./inspector/InspectorEmojiSection";
import { InspectorImageSection } from "./inspector/InspectorImageSection";
import { InspectorLinkSection } from "./inspector/InspectorLinkSection";
import { useImageImport } from "./inspector/useImageImport";

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
  const linkUrl = getMindMapNodeLinkUrl(selectedNode);
  const imageImport = useImageImport({
    onNodeImageUrlChange,
    selectedNode,
  });

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

        <InspectorBasicsSection
          onNodeKindChange={onNodeKindChange}
          onNodeNotesChange={onNodeNotesChange}
          onNodeTitleChange={onNodeTitleChange}
          selectedNode={selectedNode}
        />

        {selectedNode.kind === "image" ? (
          <InspectorImageSection {...imageImport} />
        ) : null}

        {selectedNode.kind === "link" ? (
          <InspectorLinkSection
            linkUrl={linkUrl}
            onNodeLinkUrlChange={onNodeLinkUrlChange}
          />
        ) : null}

        {selectedNode.kind === "emoji" ? (
          <InspectorEmojiSection onNodeEmojiChange={onNodeEmojiChange} />
        ) : null}

        <InspectorColorSection
          onNodeColorChange={onNodeColorChange}
          selectedColor={selectedNode.color}
        />

        <div className={drawerStyles.panelDivider} />

        <p className={styles.shortcutHint}>
          Tab adds a child, Enter adds a sibling, Cmd/Ctrl+D duplicates, and
          Delete removes the node.
        </p>
      </div>
    </aside>
  );
}
