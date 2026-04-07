import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import { CanvasBackgroundDialog } from "./CanvasBackgroundDialog";
import { CanvasStage } from "./CanvasStage";
import { CanvasViewportControls } from "./CanvasViewportControls";
import { DocumentStatus } from "./DocumentStatus";
import { InspectorDrawer } from "./InspectorDrawer";
import { MindMapMinimap } from "./MindMapMinimap";
import { MindMapTypeDialog } from "./MindMapTypeDialog";
import { NodeContextMenu } from "./NodeContextMenu";
import { OutlineDrawer } from "./OutlineDrawer";
import styles from "./EditorWorkspace.module.css";
import type { useMindMapAppModel } from "../view-models/useMindMapAppModel";

type EditorWorkspaceProps = {
  workspace: NonNullable<ReturnType<typeof useMindMapAppModel>["workspace"]>;
};

export function EditorWorkspace({ workspace }: EditorWorkspaceProps) {
  return (
    <div
      className={styles.canvasViewport}
      onWheel={workspace.viewport.onWheel}
      ref={workspace.viewport.ref}
    >
      {workspace.documentStatus ? (
        <DocumentStatus {...workspace.documentStatus} />
      ) : null}

      <CanvasViewportControls {...workspace.viewportControls} />

      <CanvasStage {...workspace.canvasStage}>
        <NodeContextMenu {...workspace.nodeContextMenu} />
      </CanvasStage>

      <OutlineDrawer {...workspace.outlineDrawer} />

      <InspectorDrawer {...workspace.inspectorDrawer} />

      {workspace.minimap ? <MindMapMinimap {...workspace.minimap} /> : null}

      <MindMapTypeDialog {...workspace.layoutDialog} />

      <CanvasBackgroundDialog {...workspace.backgroundDialog} />

      <Lightbox
        carousel={{ finite: true }}
        close={workspace.lightbox.close}
        controller={{ closeOnBackdropClick: true }}
        open={workspace.lightbox.open}
        plugins={[Zoom]}
        slides={workspace.lightbox.slides}
        zoom={{
          maxZoomPixelRatio: 4,
          scrollToZoom: true,
          wheelZoomDistanceFactor: 120,
        }}
      />
    </div>
  );
}
