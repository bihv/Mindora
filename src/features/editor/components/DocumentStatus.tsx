import styles from "./DocumentStatus.module.css";

type DocumentStatusProps = {
  currentFileName: string | null;
  hasUnsavedFileChanges: boolean;
  isFileActionPending: boolean;
  lastFileActionError: string | null;
  onOpenBackgroundDialog?: () => void;
  onOpenLayoutDialog?: () => void;
  showCanvasActions?: boolean;
};

export function DocumentStatus({
  currentFileName,
  hasUnsavedFileChanges,
  isFileActionPending,
  lastFileActionError,
  onOpenBackgroundDialog,
  onOpenLayoutDialog,
  showCanvasActions = false,
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

      {showCanvasActions && (onOpenLayoutDialog || onOpenBackgroundDialog) ? (
        <div className={[styles.statusPill, styles.actionPill].join(" ")}>
          <span className={styles.actionLabel}>Canvas</span>
          <div className={styles.actionButtons}>
            {onOpenLayoutDialog ? (
              <button
                className={styles.actionButton}
                onClick={onOpenLayoutDialog}
                type="button"
              >
                Type...
              </button>
            ) : null}
            {onOpenBackgroundDialog ? (
              <button
                className={styles.actionButton}
                onClick={onOpenBackgroundDialog}
                type="button"
              >
                Background...
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
