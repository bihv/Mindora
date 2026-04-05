import { useEffect, useId, useState } from "react";
import {
  MINDMAP_BACKGROUND_PRESETS,
  getBackgroundPreviewStyle,
  type MindMapBackgroundPresetId,
} from "../backgroundPresets";
import styles from "./MindMapTypeDialog.module.css";

type CanvasBackgroundDialogProps = {
  currentBackgroundPresetId: MindMapBackgroundPresetId;
  isOpen: boolean;
  onApply: (backgroundPresetId: MindMapBackgroundPresetId) => void;
  onClose: () => void;
};

export function CanvasBackgroundDialog({
  currentBackgroundPresetId,
  isOpen,
  onApply,
  onClose,
}: CanvasBackgroundDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [selectedBackgroundPresetId, setSelectedBackgroundPresetId] = useState(
    currentBackgroundPresetId,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedBackgroundPresetId(currentBackgroundPresetId);
  }, [currentBackgroundPresetId, isOpen]);

  useEffect(() => {
    if (!isOpen) {
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
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleApply = () => {
    if (selectedBackgroundPresetId !== currentBackgroundPresetId) {
      onApply(selectedBackgroundPresetId);
    }

    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Close background dialog"
          className={styles.closeButton}
          onClick={onClose}
          type="button"
        >
          ×
        </button>

        <header className={styles.header}>
          <span className={styles.eyebrow}>Canvas Background</span>
          <h2 id={titleId}>Choose a background</h2>
          <p id={descriptionId}>
            Change the canvas atmosphere without moving any nodes. The selected
            background is also used for exports.
          </p>
        </header>

        <section className={styles.groupSection}>
          <div className={styles.groupHeader}>
            <span aria-hidden="true" className={styles.groupCaret} />
            <h3>Background Presets</h3>
          </div>

          <div className={styles.backgroundGrid}>
            {MINDMAP_BACKGROUND_PRESETS.map((background) => {
              const isSelected = selectedBackgroundPresetId === background.id;
              const isCurrent = currentBackgroundPresetId === background.id;

              return (
                <button
                  aria-label={`Canvas background ${background.label}`}
                  aria-pressed={isSelected}
                  className={[
                    styles.backgroundCard,
                    isSelected ? styles.backgroundCardSelected : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={background.id}
                  onClick={() => setSelectedBackgroundPresetId(background.id)}
                  type="button"
                >
                  {isCurrent ? (
                    <span className={styles.currentBadge}>Current</span>
                  ) : null}

                  <span
                    aria-hidden="true"
                    className={styles.backgroundPreview}
                    style={getBackgroundPreviewStyle(background.id)}
                  />

                  <span className={styles.backgroundMeta}>
                    <strong>{background.label}</strong>
                    <span>{background.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerText}>
            <strong>Tip:</strong> You can reopen this anytime from the desktop
            menu: Layout → Background...
          </div>
          <div className={styles.actions}>
            <button
              className={styles.secondaryButton}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className={styles.primaryButton}
              onClick={handleApply}
              type="button"
            >
              {selectedBackgroundPresetId === currentBackgroundPresetId
                ? "Done"
                : "Apply background"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
