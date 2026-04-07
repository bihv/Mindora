import { NODE_COLORS } from "../../../../domain/mindmap/model";
import type { NodeColor } from "../../../../domain/mindmap/model";
import styles from "../InspectorDrawer.module.css";

type InspectorColorSectionProps = {
  onNodeColorChange: (color: NodeColor) => void;
  selectedColor: NodeColor;
};

export function InspectorColorSection({
  onNodeColorChange,
  selectedColor,
}: InspectorColorSectionProps) {
  return (
    <div className={styles.field}>
      <span>Color</span>
      <div className={styles.colorGrid}>
        {(Object.entries(NODE_COLORS) as [
          NodeColor,
          (typeof NODE_COLORS)[NodeColor],
        ][]).map(([colorKey, colorValue]) => (
          <button
            aria-label={colorValue.label}
            className={[
              styles.colorChip,
              selectedColor === colorKey ? styles.colorChipActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={colorKey}
            onClick={() => onNodeColorChange(colorKey)}
            type="button"
          >
            <span
              className={styles.colorChipSwatch}
              style={{
                background: colorValue.accent,
                boxShadow: `0 0 0 6px ${colorValue.glow}`,
              }}
            />
            <span>{colorValue.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
