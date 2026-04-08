import styles from "./CanvasViewportControls.module.css";

type CanvasViewportControlsProps = {
  canCenterSelected: boolean;
  onGenerateAiMap?: () => void;
  onCenterSelected: () => void;
  onFitMap: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomPercentage: number;
};

export function CanvasViewportControls({
  canCenterSelected,
  onGenerateAiMap,
  onCenterSelected,
  onFitMap,
  onZoomIn,
  onZoomOut,
  zoomPercentage,
}: CanvasViewportControlsProps) {
  return (
    <div
      aria-label="Map controls"
      className={styles.viewportControls}
      role="toolbar"
    >
      <div className={styles.controlGroup}>
        <button
          aria-label="Zoom out"
          className={[styles.controlButton, styles.controlButtonSquare].join(" ")}
          onClick={onZoomOut}
          type="button"
        >
          -
        </button>
        <span aria-live="polite" className={styles.zoomValue}>
          {zoomPercentage}%
        </span>
        <button
          aria-label="Zoom in"
          className={[styles.controlButton, styles.controlButtonSquare].join(" ")}
          onClick={onZoomIn}
          type="button"
        >
          +
        </button>
      </div>

      <div className={styles.controlGroup}>
        {onGenerateAiMap ? (
          <button className={styles.controlButton} onClick={onGenerateAiMap} type="button">
            AI map
          </button>
        ) : null}
        <button className={styles.controlButton} onClick={onFitMap} type="button">
          Fit map
        </button>
        <button
          className={styles.controlButton}
          disabled={!canCenterSelected}
          onClick={onCenterSelected}
          type="button"
        >
          Center node
        </button>
      </div>
    </div>
  );
}
