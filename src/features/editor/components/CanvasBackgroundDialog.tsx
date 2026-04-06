import { useEffect, useId } from "react";
import {
  MINDMAP_BACKGROUND_PRESETS,
  getBackgroundPreviewStyle,
  type MindMapBackgroundPresetId,
} from "../backgroundPresets";
import drawerStyles from "./EditorDrawer.module.css";
import styles from "./MindMapTypeDialog.module.css";

type CanvasBackgroundDialogProps = {
  currentBackgroundPresetId: MindMapBackgroundPresetId;
  initialBackgroundPresetId: MindMapBackgroundPresetId | null;
  isOpen: boolean;
  onReset: () => void;
  onSelect: (backgroundPresetId: MindMapBackgroundPresetId) => void;
  onClose: () => void;
};

export function CanvasBackgroundDialog({
  currentBackgroundPresetId,
  initialBackgroundPresetId,
  isOpen,
  onReset,
  onSelect,
  onClose,
}: CanvasBackgroundDialogProps) {
  const titleId = useId();

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

  const canReset =
    initialBackgroundPresetId !== null &&
    initialBackgroundPresetId !== currentBackgroundPresetId;

  return (
    <aside
      aria-labelledby={titleId}
      className={[
        drawerStyles.canvasDrawer,
        drawerStyles.canvasDrawerRight,
        drawerStyles.isOpen,
      ].join(" ")}
      data-native-scroll="true"
      onWheel={(event) => event.stopPropagation()}
    >
      <section
        aria-labelledby={titleId}
        className={[
          drawerStyles.floatingPanel,
          styles.layoutPanel,
          styles.backgroundPanel,
        ].join(" ")}
        role="region"
      >
        <header className={styles.layoutPanelHeader}>
          <div className={[styles.header, styles.backgroundPanelHeader].join(" ")}>
            <span className={styles.eyebrow} id={titleId}>
              Canvas Background
            </span>
          </div>

          <button
            aria-label="Close background panel"
            className={styles.panelCloseButton}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className={styles.layoutPanelActions}>
          <button
            className={styles.secondaryButton}
            disabled={!canReset}
            onClick={onReset}
            type="button"
          >
            Reset
          </button>
        </div>

        <div className={styles.backgroundPanelBody}>
          <section className={styles.groupSection}>
            <div className={styles.groupHeader}>
              <span aria-hidden="true" className={styles.groupCaret} />
              <h3>Background Presets</h3>
            </div>

            <div
              className={[styles.backgroundGrid, styles.backgroundGridPanel].join(" ")}
            >
              {MINDMAP_BACKGROUND_PRESETS.map((background) => {
                const isSelected = currentBackgroundPresetId === background.id;

                return (
                  <button
                    aria-label={`Canvas background ${background.label}`}
                    aria-pressed={isSelected}
                    className={[
                      styles.backgroundCard,
                      styles.backgroundCardPanel,
                      isSelected ? styles.backgroundCardSelected : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={background.id}
                    onClick={() => onSelect(background.id)}
                    type="button"
                  >
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
        </div>
      </section>
    </aside>
  );
}
