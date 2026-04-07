import { useEffect, useId } from "react";
import { MINDMAP_BACKGROUND_PRESETS } from "../../../domain/mindmap/backgroundPresets/presetCatalog";
import type { MindMapBackgroundPresetId } from "../../../domain/mindmap/backgroundPresets/presetCatalog";
import { getBackgroundPreviewStyle } from "../../../domain/mindmap/backgroundPresets/canvasBackgroundStyle";
import drawerStyles from "./EditorDrawer.module.css";
import backgroundStyles from "./CanvasBackgroundCard.module.css";
import panelStyles from "./MindMapDialogPanel.module.css";

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
          panelStyles.layoutPanel,
          panelStyles.backgroundPanel,
        ].join(" ")}
        role="region"
      >
        <header className={panelStyles.layoutPanelHeader}>
          <div
            className={[panelStyles.header, panelStyles.backgroundPanelHeader].join(
              " ",
            )}
          >
            <span className={panelStyles.eyebrow} id={titleId}>
              Canvas Background
            </span>
          </div>

          <button
            aria-label="Close background panel"
            className={panelStyles.panelCloseButton}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className={panelStyles.layoutPanelActions}>
          <button
            className={panelStyles.secondaryButton}
            disabled={!canReset}
            onClick={onReset}
            type="button"
          >
            Reset
          </button>
        </div>

        <div className={panelStyles.backgroundPanelBody}>
          <section className={panelStyles.groupSection}>
            <div className={panelStyles.groupHeader}>
              <span aria-hidden="true" className={panelStyles.groupCaret} />
              <h3>Background Presets</h3>
            </div>

            <div
              className={[
                backgroundStyles.backgroundGrid,
                backgroundStyles.backgroundGridPanel,
              ].join(" ")}
            >
              {MINDMAP_BACKGROUND_PRESETS.map((background) => {
                const isSelected = currentBackgroundPresetId === background.id;

                return (
                  <button
                    aria-label={`Canvas background ${background.label}`}
                    aria-pressed={isSelected}
                    className={[
                      backgroundStyles.backgroundCard,
                      backgroundStyles.backgroundCardPanel,
                      isSelected ? backgroundStyles.backgroundCardSelected : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={background.id}
                    onClick={() => onSelect(background.id)}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={backgroundStyles.backgroundPreview}
                      style={getBackgroundPreviewStyle(background.id)}
                    />

                    <span className={backgroundStyles.backgroundMeta}>
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
