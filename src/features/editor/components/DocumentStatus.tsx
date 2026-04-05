import styles from "./DocumentStatus.module.css";

type DocumentStatusProps = {
  currentFileName: string | null;
  hasUnsavedFileChanges: boolean;
  isFileActionPending: boolean;
  lastFileActionError: string | null;
};

export function DocumentStatus({
  currentFileName,
  hasUnsavedFileChanges,
  isFileActionPending,
  lastFileActionError,
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
    </div>
  );
}
