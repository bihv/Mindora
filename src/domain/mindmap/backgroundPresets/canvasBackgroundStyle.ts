import type { MindMapBackgroundPresetId } from "./presetCatalog";

type CameraLike = {
  x: number;
  y: number;
  scale?: number;
};

export type CanvasBackgroundStyle = {
  backgroundColor: string;
  backgroundImage: string;
  backgroundPosition: string;
  backgroundRepeat: string;
  backgroundSize: string;
};

export function getCanvasBackgroundStyle(
  backgroundPresetId: MindMapBackgroundPresetId,
  camera: CameraLike,
): CanvasBackgroundStyle {
  const viewportScale = camera.scale ?? 1;
  const gridPosition = `${-camera.x * viewportScale}px ${-camera.y * viewportScale}px`;
  const scaledGridSize = (size: number) =>
    `${size * viewportScale}px ${size * viewportScale}px`;

  switch (backgroundPresetId) {
    case "aurora-mesh":
      return {
        backgroundColor: "#06121a",
        backgroundImage: [
          "linear-gradient(rgba(126, 235, 218, 0.03) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(126, 235, 218, 0.03) 1px, transparent 1px)",
          "radial-gradient(circle at 18% 18%, rgba(77, 215, 197, 0.24), transparent 30%)",
          "radial-gradient(circle at 82% 14%, rgba(109, 156, 255, 0.2), transparent 24%)",
          "linear-gradient(180deg, rgba(7, 23, 31, 0.98), rgba(4, 13, 21, 0.99))",
        ].join(", "),
        backgroundPosition: [
          gridPosition,
          gridPosition,
          "center",
          "center",
          "center",
        ].join(", "),
        backgroundRepeat: "repeat, repeat, no-repeat, no-repeat, no-repeat",
        backgroundSize: `${scaledGridSize(40)}, ${scaledGridSize(40)}, 100% 100%, 100% 100%, 100% 100%`,
      };
    case "ember-glow":
      return {
        backgroundColor: "#120a0d",
        backgroundImage: [
          "linear-gradient(rgba(255, 220, 190, 0.028) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(255, 220, 190, 0.028) 1px, transparent 1px)",
          "radial-gradient(circle at 22% 18%, rgba(255, 172, 117, 0.22), transparent 28%)",
          "radial-gradient(circle at 82% 16%, rgba(255, 122, 114, 0.16), transparent 22%)",
          "linear-gradient(180deg, rgba(30, 15, 18, 0.98), rgba(13, 8, 11, 0.99))",
        ].join(", "),
        backgroundPosition: [
          gridPosition,
          gridPosition,
          "center",
          "center",
          "center",
        ].join(", "),
        backgroundRepeat: "repeat, repeat, no-repeat, no-repeat, no-repeat",
        backgroundSize: `${scaledGridSize(44)}, ${scaledGridSize(44)}, 100% 100%, 100% 100%, 100% 100%`,
      };
    case "evergreen-grid":
      return {
        backgroundColor: "#07110f",
        backgroundImage: [
          "linear-gradient(rgba(178, 247, 218, 0.024) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(178, 247, 218, 0.024) 1px, transparent 1px)",
          "radial-gradient(circle at 20% 18%, rgba(88, 187, 153, 0.22), transparent 30%)",
          "radial-gradient(circle at 78% 12%, rgba(143, 205, 173, 0.12), transparent 24%)",
          "linear-gradient(180deg, rgba(9, 23, 20, 0.98), rgba(4, 12, 10, 0.99))",
        ].join(", "),
        backgroundPosition: [
          gridPosition,
          gridPosition,
          "center",
          "center",
          "center",
        ].join(", "),
        backgroundRepeat: "repeat, repeat, no-repeat, no-repeat, no-repeat",
        backgroundSize: `${scaledGridSize(46)}, ${scaledGridSize(46)}, 100% 100%, 100% 100%, 100% 100%`,
      };
    case "nocturne-dots":
      return {
        backgroundColor: "#090a18",
        backgroundImage: [
          "radial-gradient(circle, rgba(255, 255, 255, 0.11) 1.1px, transparent 1.3px)",
          "radial-gradient(circle at 20% 18%, rgba(132, 110, 255, 0.2), transparent 30%)",
          "radial-gradient(circle at 78% 14%, rgba(94, 171, 255, 0.12), transparent 24%)",
          "linear-gradient(180deg, rgba(11, 12, 30, 0.98), rgba(6, 7, 18, 0.99))",
        ].join(", "),
        backgroundPosition: [gridPosition, "center", "center", "center"].join(
          ", ",
        ),
        backgroundRepeat: "repeat, no-repeat, no-repeat, no-repeat",
        backgroundSize: `${scaledGridSize(36)}, 100% 100%, 100% 100%, 100% 100%`,
      };
    case "midnight-grid":
    default:
      return {
        backgroundColor: "#08101a",
        backgroundImage: [
          "linear-gradient(rgba(255, 255, 255, 0.022) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(255, 255, 255, 0.022) 1px, transparent 1px)",
          "radial-gradient(circle at 0% 0%, rgba(60, 90, 152, 0.18), transparent 32%)",
          "linear-gradient(180deg, rgba(9, 15, 26, 0.98), rgba(6, 11, 20, 0.98))",
        ].join(", "),
        backgroundPosition: [
          gridPosition,
          gridPosition,
          "center",
          "center",
        ].join(", "),
        backgroundRepeat: "repeat, repeat, no-repeat, no-repeat",
        backgroundSize: `${scaledGridSize(44)}, ${scaledGridSize(44)}, 100% 100%, 100% 100%`,
      };
  }
}

export function getBackgroundPreviewStyle(
  backgroundPresetId: MindMapBackgroundPresetId,
): CanvasBackgroundStyle {
  return getCanvasBackgroundStyle(backgroundPresetId, { x: 0, y: 0, scale: 1 });
}
