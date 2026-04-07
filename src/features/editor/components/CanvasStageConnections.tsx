import type { CSSProperties } from "react";
import { joinClassNames } from "../../../shared/classNames";
import type { ConnectorItem, ConnectorPreviewItem } from "../types";
import styles from "./CanvasStageShell.module.css";

type CanvasStageConnectionsProps = {
  cameraScale: number;
  connectors: ConnectorItem[];
  previewConnector: ConnectorPreviewItem | null;
};

const connectorFocusClassNames: Record<ConnectorItem["focusState"], string> = {
  lineage: styles.connectionsPathLineage,
  descendant: styles.connectionsPathDescendant,
  dimmed: styles.connectionsPathDimmed,
};

export function CanvasStageConnections({
  cameraScale,
  connectors,
  previewConnector,
}: CanvasStageConnectionsProps) {
  return (
    <svg
      aria-hidden="true"
      className={styles.connections}
      height="100%"
      style={
        {
          "--viewport-scale": cameraScale.toString(),
        } as CSSProperties
      }
      width="100%"
    >
      {connectors.map((connector) => (
        <path
          className={joinClassNames(
            styles.connectionsPath,
            connectorFocusClassNames[connector.focusState],
          )}
          d={connector.path}
          key={connector.id}
          stroke={connector.color}
        />
      ))}
      {previewConnector ? (
        <path
          className={joinClassNames(
            styles.connectionsPath,
            styles.connectionsPathPreview,
            previewConnector.isSnapped && styles.connectionsPathPreviewSnapped,
          )}
          d={previewConnector.path}
          stroke={previewConnector.color}
        />
      ) : null}
    </svg>
  );
}
