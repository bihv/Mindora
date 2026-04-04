type CanvasControlsProps = {
  isOutlineOpen: boolean;
  onAutoLayout: () => void;
  onToggleOutline: () => void;
};

export function CanvasControls({
  isOutlineOpen,
  onAutoLayout,
  onToggleOutline,
}: CanvasControlsProps) {
  return (
    <div className="canvas-control canvas-control--top-left">
      <div className="control-dock">
        <button
          className={`floating-toggle${isOutlineOpen ? " floating-toggle--active" : ""}`}
          onClick={onToggleOutline}
          type="button"
        >
          Outline
        </button>
        <button
          className="floating-toggle"
          onClick={onAutoLayout}
          type="button"
        >
          Auto layout
        </button>
      </div>
    </div>
  );
}
