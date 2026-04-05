import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { MINIMAP_HEIGHT, MINIMAP_WIDTH } from "../constants";
import type { MinimapData } from "../types";
import styles from "./MindMapMinimap.module.css";

const connectorFocusClassNames = {
  lineage: styles.minimapConnectorLineage,
  descendant: styles.minimapConnectorDescendant,
  dimmed: styles.minimapConnectorDimmed,
} as const;

const nodeFocusClassNames = {
  selected: "",
  lineage: styles.minimapNodeLineage,
  descendant: styles.minimapNodeDescendant,
  dimmed: styles.minimapNodeDimmed,
} as const;

type MindMapMinimapProps = {
  minimap: MinimapData;
  minimapRef: RefObject<SVGSVGElement | null>;
  onPointerDown: (event: ReactPointerEvent<SVGSVGElement>) => void;
};

export function MindMapMinimap({
  minimap,
  minimapRef,
  onPointerDown,
}: MindMapMinimapProps) {
  return (
    <div className={styles.minimap}>
      <svg
        aria-label="Canvas minimap"
        className={styles.surface}
        height={MINIMAP_HEIGHT}
        onPointerDown={onPointerDown}
        ref={minimapRef}
        viewBox={`0 0 ${MINIMAP_WIDTH} ${MINIMAP_HEIGHT}`}
        width={MINIMAP_WIDTH}
      >
        <rect
          className={styles.bounds}
          height={MINIMAP_HEIGHT - 1}
          rx="16"
          width={MINIMAP_WIDTH - 1}
          x="0.5"
          y="0.5"
        />
        {minimap.connectorPaths.map((connector) => (
          <path
            className={[
              styles.connector,
              connectorFocusClassNames[connector.focusState],
            ].join(" ")}
            d={connector.path}
            key={connector.id}
          />
        ))}
        {minimap.nodes.map((node) => (
          <rect
            className={[
              styles.node,
              nodeFocusClassNames[node.focusState],
              node.isSelected ? styles.minimapNodeSelected : "",
            ]
              .filter(Boolean)
              .join(" ")}
            fill={node.color}
            height={node.height}
            key={node.id}
            rx="1.5"
            width={node.width}
            x={node.x}
            y={node.y}
          />
        ))}
        <rect
          className={styles.viewport}
          height={minimap.viewport.height}
          rx="0"
          width={minimap.viewport.width}
          x={minimap.viewport.x}
          y={minimap.viewport.y}
        />
      </svg>
    </div>
  );
}
