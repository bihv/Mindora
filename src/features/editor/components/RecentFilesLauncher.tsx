import type { StoredMindMapDraft } from "../../../mindmap";
import type { RecentMindMapFile } from "../filePersistence";
import styles from "./RecentFilesLauncher.module.css";

type RecentFilesLauncherProps = {
  isFileActionPending: boolean;
  lastFileActionError: string | null;
  onCreateMindMap: () => void;
  onDiscardStoredDraft: () => void;
  onOpenFile: () => void;
  onOpenRecentFile: (path: string) => void;
  onRecoverStoredDraft: () => void;
  recentFiles: RecentMindMapFile[];
  recoverableDraft: StoredMindMapDraft | null;
};

export function RecentFilesLauncher({
  isFileActionPending,
  lastFileActionError,
  onCreateMindMap,
  onDiscardStoredDraft,
  onOpenFile,
  onOpenRecentFile,
  onRecoverStoredDraft,
  recentFiles,
  recoverableDraft,
}: RecentFilesLauncherProps) {
  const draftUpdatedAtLabel =
    recoverableDraft?.updatedAt === null || !recoverableDraft
      ? null
      : new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(recoverableDraft.updatedAt));

  return (
    <main className={styles.startupScreen}>
      <section className={styles.panel}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Mindora</span>
          <h1>Open a recent map or start fresh</h1>
          <p>
            Choose a recent file to load it, start a new mindmap, or browse for
            another map on disk.
          </p>
        </header>

        {recoverableDraft ? (
          <section className={styles.recoveryCard}>
            <div className={styles.recoveryCopy}>
              <span className={styles.recoveryEyebrow}>Unsaved Draft</span>
              <h2>Recover unsaved draft?</h2>
              <p>
                Resume <strong>{recoverableDraft.document.title}</strong>
                {draftUpdatedAtLabel ? ` from ${draftUpdatedAtLabel}` : ""}.
              </p>
              {recoverableDraft.fileName ? (
                <span className={styles.recoveryMeta}>
                  Last linked file: {recoverableDraft.fileName}
                </span>
              ) : null}
            </div>

            <div className={styles.recoveryActions}>
              <button
                className={styles.primaryButton}
                disabled={isFileActionPending}
                onClick={onRecoverStoredDraft}
                type="button"
              >
                Recover draft
              </button>
              <button
                className={styles.secondaryButton}
                disabled={isFileActionPending}
                onClick={onDiscardStoredDraft}
                type="button"
              >
                Discard
              </button>
            </div>
          </section>
        ) : null}

        <div className={styles.actions}>
          <div className={styles.buttonRow}>
            <button
              className={styles.primaryButton}
              disabled={isFileActionPending}
              onClick={onCreateMindMap}
              type="button"
            >
              New mindmap
            </button>
            <button
              className={styles.secondaryButton}
              disabled={isFileActionPending}
              onClick={onOpenFile}
              type="button"
            >
              {isFileActionPending ? "Opening..." : "Browse files"}
            </button>
          </div>
          <span className={styles.hint}>Supported: `.mindora`</span>
        </div>

        {lastFileActionError ? (
          <div className={styles.error} role="alert">
            {lastFileActionError}
          </div>
        ) : null}

        <div className={styles.list}>
          {recentFiles.length > 0 ? (
            recentFiles.map((recentFile) => (
              <button
                key={recentFile.path}
                className={styles.recentFileCard}
                disabled={isFileActionPending}
                onClick={() => onOpenRecentFile(recentFile.path)}
                type="button"
              >
                <strong>{recentFile.fileName}</strong>
                <span>{recentFile.path}</span>
              </button>
            ))
          ) : (
            <div className={styles.empty}>
              No recent desktop files yet. Open a map once and it will appear here
              next time.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
