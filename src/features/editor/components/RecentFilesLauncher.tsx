import type { RecentMindMapFile } from "../filePersistence";
import styles from "./RecentFilesLauncher.module.css";

type RecentFilesLauncherProps = {
  isFileActionPending: boolean;
  lastFileActionError: string | null;
  onCreateMindMap: () => void;
  onOpenFile: () => void;
  onOpenRecentFile: (path: string) => void;
  recentFiles: RecentMindMapFile[];
};

export function RecentFilesLauncher({
  isFileActionPending,
  lastFileActionError,
  onCreateMindMap,
  onOpenFile,
  onOpenRecentFile,
  recentFiles,
}: RecentFilesLauncherProps) {
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
          <span className={styles.hint}>Supported: `.mindora.json`, `.json`</span>
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
