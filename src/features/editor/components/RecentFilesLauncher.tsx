import type { RecentMindMapFile } from "../filePersistence";

type RecentFilesLauncherProps = {
  isFileActionPending: boolean;
  lastFileActionError: string | null;
  onOpenFile: () => void;
  onOpenRecentFile: (path: string) => void;
  recentFiles: RecentMindMapFile[];
};

export function RecentFilesLauncher({
  isFileActionPending,
  lastFileActionError,
  onOpenFile,
  onOpenRecentFile,
  recentFiles,
}: RecentFilesLauncherProps) {
  return (
    <main className="startup-screen">
      <section className="startup-screen__panel">
        <header className="startup-screen__header">
          <span className="startup-screen__eyebrow">Mindora</span>
          <h1>Open a recent map</h1>
          <p>
            The app starts with your recent desktop files only. Choose one to load
            it, or browse for another map on disk.
          </p>
        </header>

        <div className="startup-screen__actions">
          <button
            className="startup-screen__primary"
            disabled={isFileActionPending}
            onClick={onOpenFile}
            type="button"
          >
            {isFileActionPending ? "Opening..." : "Browse files"}
          </button>
          <span className="startup-screen__hint">Supported: `.mindora.json`, `.json`</span>
        </div>

        {lastFileActionError ? (
          <div className="startup-screen__error" role="alert">
            {lastFileActionError}
          </div>
        ) : null}

        <div className="startup-screen__list">
          {recentFiles.length > 0 ? (
            recentFiles.map((recentFile) => (
              <button
                key={recentFile.path}
                className="recent-file-card"
                disabled={isFileActionPending}
                onClick={() => onOpenRecentFile(recentFile.path)}
                type="button"
              >
                <strong>{recentFile.fileName}</strong>
                <span>{recentFile.path}</span>
              </button>
            ))
          ) : (
            <div className="startup-screen__empty">
              No recent desktop files yet. Open a map once and it will appear here
              next time.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
