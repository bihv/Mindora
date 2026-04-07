import {
  MINDMAP_NODE_KINDS,
  MINDMAP_NODE_KIND_LABELS,
} from "../../../../domain/mindmap/model";
import type {
  MindMapNode,
  MindMapNodeKind,
} from "../../../../domain/mindmap/model";
import styles from "../InspectorDrawer.module.css";

type InspectorBasicsSectionProps = {
  onNodeKindChange: (kind: MindMapNodeKind) => void;
  onNodeNotesChange: (value: string) => void;
  onNodeTitleChange: (value: string) => void;
  selectedNode: MindMapNode;
};

export function InspectorBasicsSection({
  onNodeKindChange,
  onNodeNotesChange,
  onNodeTitleChange,
  selectedNode,
}: InspectorBasicsSectionProps) {
  return (
    <>
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

      <label className={styles.field}>
        <span>Notes</span>
        <textarea
          onChange={(event) => onNodeNotesChange(event.currentTarget.value)}
          placeholder="Optional context"
          rows={5}
          value={selectedNode.notes}
        />
      </label>
    </>
  );
}
