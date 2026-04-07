import styles from "../InspectorDrawer.module.css";

type InspectorLinkSectionProps = {
  linkUrl: string;
  onNodeLinkUrlChange: (value: string) => void;
};

export function InspectorLinkSection({
  linkUrl,
  onNodeLinkUrlChange,
}: InspectorLinkSectionProps) {
  return (
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
  );
}
