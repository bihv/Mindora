import { describe, expect, it } from "vitest";
import {
  DEFAULT_MINDMAP_BACKGROUND_PRESET_ID,
  MINDMAP_BACKGROUND_PRESETS,
  isMindMapBackgroundPresetId,
} from "./backgroundPresets/presetCatalog";
import {
  getBackgroundPreviewStyle,
  getCanvasBackgroundStyle,
} from "./backgroundPresets/canvasBackgroundStyle";
import { buildExportBackground } from "./backgroundPresets/exportBackground";

describe("background presets barrel", () => {
  it("keeps preset catalog and id guards intact", () => {
    expect(isMindMapBackgroundPresetId(DEFAULT_MINDMAP_BACKGROUND_PRESET_ID)).toBe(
      true,
    );
    expect(MINDMAP_BACKGROUND_PRESETS).toHaveLength(5);
    expect(isMindMapBackgroundPresetId("not-a-preset")).toBe(false);
  });

  it("builds canvas and export styles from split modules", () => {
    const preview = getBackgroundPreviewStyle("aurora-mesh");
    const cameraStyle = getCanvasBackgroundStyle("aurora-mesh", {
      x: 40,
      y: 20,
      scale: 2,
    });
    const exportBackground = buildExportBackground("aurora-mesh", 800, 600);

    expect(preview.backgroundRepeat).toContain("repeat");
    expect(cameraStyle.backgroundPosition).toContain("-80px");
    expect(exportBackground.defs).toContain("mindora-export-grid");
    expect(exportBackground.markup).toContain('width="800"');
  });
});
