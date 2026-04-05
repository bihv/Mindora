import styles from "./DocumentStatus.module.css";

type DocumentStatusProps = {
  currentFileName: string | null;
  hasUnsavedFileChanges: boolean;
  isFileActionPending: boolean;
  lastFileActionError: string | null;
  onOpenLayoutDialog?: () => void;
  showLayoutAction?: boolean;
};

export function DocumentStatus({
  currentFileName,
  hasUnsavedFileChanges,
  isFileActionPending,
  lastFileActionError,
  onOpenLayoutDialog,
  showLayoutAction = false,
}: DocumentStatusProps) {
  const statusLabel = isFileActionPending
    ? "Working..."
    : lastFileActionError
      ? lastFileActionError
      : currentFileName
        ? hasUnsavedFileChanges
          ? "Modified"
          : "Saved"
        : "No file open";

  return (
    <div className={styles.canvasStatus}>
      <div
        className={[
          styles.statusPill,
          lastFileActionError ? styles.statusPillError : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <strong>{currentFileName ?? "No file open"}</strong>
        <span>{statusLabel}</span>
      </div>

      {showLayoutAction && onOpenLayoutDialog ? (
        <div className={[styles.statusPill, styles.actionPill].join(" ")}>
          <span className={styles.actionLabel}>Layout</span>
          <button
            className={styles.actionButton}
            onClick={onOpenLayoutDialog}
            type="button"
          >
            Mindmap Type...
          </button>
        </div>
      ) : null}
    </div>
  );
}
