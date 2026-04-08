import { useEffect, useId } from "react";
import styles from "./AiGenerationDialog.module.css";

type AiGenerationDialogProps = {
  apiKey: string;
  endpointUrl: string;
  isOpen: boolean;
  isPending: boolean;
  lastError: string | null;
  model: string;
  onApiKeyChange: (value: string) => void;
  onEndpointUrlChange: (value: string) => void;
  onClose: () => void;
  onModelChange: (value: string) => void;
  onRememberChange: (value: boolean) => void;
  onSourceTextChange: (value: string) => void;
  onSubmit: () => void;
  onTopicChange: (value: string) => void;
  remember: boolean;
  sourceText: string;
  topic: string;
};

export function AiGenerationDialog({
  apiKey,
  endpointUrl,
  isOpen,
  isPending,
  lastError,
  model,
  onApiKeyChange,
  onEndpointUrlChange,
  onClose,
  onModelChange,
  onRememberChange,
  onSourceTextChange,
  onSubmit,
  onTopicChange,
  remember,
  sourceText,
  topic,
}: AiGenerationDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen || isPending) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isPending, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-labelledby={titleId}
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) {
          onClose();
        }
      }}
      role="dialog"
    >
      <section className={styles.panel}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <span className={styles.eyebrow}>Desktop AI</span>
            <h2 id={titleId}>Generate A Mind Map</h2>
            <p>
              Connect to an OpenAI-compatible endpoint URL, then turn a topic
              and optional source text into a fresh map.
            </p>
          </div>

          <button
            aria-label="Close AI dialog"
            className={styles.closeButton}
            disabled={isPending}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className={styles.formBody}>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Endpoint URL</span>
                <input
                  autoCapitalize="off"
                  autoComplete="off"
                  disabled={isPending}
                  onChange={(event) =>
                    onEndpointUrlChange(event.currentTarget.value)
                  }
                  placeholder="https://api.openai.com/v1/responses"
                  spellCheck={false}
                  value={endpointUrl}
                />
                <span className={styles.fieldHint}>
                  You can paste a full `.../responses` or `.../chat/completions`
                  URL. If you enter only `.../v1`, Mindora will default to
                  `.../responses`.
                </span>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Model</span>
                <input
                  autoCapitalize="off"
                  autoComplete="off"
                  disabled={isPending}
                  onChange={(event) => onModelChange(event.currentTarget.value)}
                  placeholder="gpt-5-mini"
                  spellCheck={false}
                  value={model}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>API Key</span>
              <input
                autoCapitalize="off"
                autoComplete="off"
                disabled={isPending}
                onChange={(event) => onApiKeyChange(event.currentTarget.value)}
                placeholder="sk-..."
                spellCheck={false}
                type="password"
                value={apiKey}
              />
            </label>

            <label className={styles.checkbox}>
              <input
                checked={remember}
                disabled={isPending}
                onChange={(event) => onRememberChange(event.currentTarget.checked)}
                type="checkbox"
              />
              <span>Remember this API key on this device using the desktop keychain.</span>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Topic</span>
              <input
                disabled={isPending}
                onChange={(event) => onTopicChange(event.currentTarget.value)}
                placeholder="Quarterly product roadmap"
                value={topic}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Source Text</span>
              <textarea
                disabled={isPending}
                onChange={(event) => onSourceTextChange(event.currentTarget.value)}
                placeholder="Paste notes, a draft outline, meeting notes, or a long paragraph here."
                rows={9}
                value={sourceText}
              />
              <span className={styles.fieldHint}>
                Leave this empty if you want the model to brainstorm from the
                topic alone.
              </span>
            </label>

            {lastError ? <div className={styles.error}>{lastError}</div> : null}
          </div>

          <div className={styles.actions}>
            <button
              className={styles.secondaryButton}
              disabled={isPending}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button className={styles.primaryButton} disabled={isPending} type="submit">
              {isPending ? "Generating..." : "Generate Mind Map"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
