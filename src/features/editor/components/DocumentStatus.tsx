import { EXPORT_FORMATS, EXPORT_FORMAT_LABELS, type ExportFormat } from "../exportTypes";
import styles from "./DocumentStatus.module.css";

type DocumentStatusProps = {
  currentFileName: string | null;
  hasUnsavedFileChanges: boolean;
  isFileActionPending: boolean;
  lastFileActionError: string | null;
  onExportFile: (format: ExportFormat) => void;
};

export function DocumentStatus({
  currentFileName,
  hasUnsavedFileChanges,
  isFileActionPending,
  lastFileActionError,
  onExportFile,
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

      <div className={styles.actionRow}>
        {EXPORT_FORMATS.map((format) => (
          <button
            key={format}
            className={styles.exportButton}
            disabled={isFileActionPending}
            onClick={() => onExportFile(format)}
            type="button"
          >
            {EXPORT_FORMAT_LABELS[format]}
          </button>
        ))}
      </div>
    </div>
  );
}
