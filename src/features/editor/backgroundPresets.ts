export const MINDMAP_BACKGROUND_PRESET_IDS = [
  "midnight-grid",
  "aurora-mesh",
  "ember-glow",
  "evergreen-grid",
  "nocturne-dots",
] as const;

export type MindMapBackgroundPresetId =
  (typeof MINDMAP_BACKGROUND_PRESET_IDS)[number];

export type MindMapBackgroundPreset = {
  id: MindMapBackgroundPresetId;
  label: string;
  description: string;
};

type CameraLike = {
  x: number;
  y: number;
};

type ExportBackground = {
  defs: string;
  markup: string;
};

export type CanvasBackgroundStyle = {
  backgroundColor: string;
  backgroundImage: string;
  backgroundPosition: string;
  backgroundRepeat: string;
  backgroundSize: string;
};

export const DEFAULT_MINDMAP_BACKGROUND_PRESET_ID: MindMapBackgroundPresetId =
  "midnight-grid";

export const MINDMAP_BACKGROUND_PRESETS: MindMapBackgroundPreset[] = [
  {
    id: "midnight-grid",
    label: "Midnight Grid",
    description: "Dark navy canvas with the original subtle grid.",
  },
  {
    id: "aurora-mesh",
    label: "Aurora Mesh",
    description: "Cool teal-blue glow for lighter brainstorming sessions.",
  },
  {
    id: "ember-glow",
    label: "Ember Glow",
    description: "Warm amber and coral highlights with a soft grid.",
  },
  {
    id: "evergreen-grid",
    label: "Evergreen Grid",
    description: "Forest-toned canvas with balanced contrast and depth.",
  },
  {
    id: "nocturne-dots",
    label: "Nocturne Dots",
    description: "Deep indigo backdrop with a tighter dotted field.",
  },
];

export function isMindMapBackgroundPresetId(
  value: unknown,
): value is MindMapBackgroundPresetId {
  return (
    typeof value === "string" &&
    MINDMAP_BACKGROUND_PRESET_IDS.includes(value as MindMapBackgroundPresetId)
  );
}

export function getCanvasBackgroundStyle(
  backgroundPresetId: MindMapBackgroundPresetId,
  camera: CameraLike,
): CanvasBackgroundStyle {
  const gridPosition = `${-camera.x}px ${-camera.y}px`;

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
        backgroundSize: "40px 40px, 40px 40px, 100% 100%, 100% 100%, 100% 100%",
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
        backgroundSize: "44px 44px, 44px 44px, 100% 100%, 100% 100%, 100% 100%",
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
        backgroundSize: "46px 46px, 46px 46px, 100% 100%, 100% 100%, 100% 100%",
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
        backgroundPosition: [
          gridPosition,
          "center",
          "center",
          "center",
        ].join(", "),
        backgroundRepeat: "repeat, no-repeat, no-repeat, no-repeat",
        backgroundSize: "36px 36px, 100% 100%, 100% 100%, 100% 100%",
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
        backgroundSize: "44px 44px, 44px 44px, 100% 100%, 100% 100%",
      };
  }
}

export function getBackgroundPreviewStyle(
  backgroundPresetId: MindMapBackgroundPresetId,
): CanvasBackgroundStyle {
  return getCanvasBackgroundStyle(backgroundPresetId, { x: 0, y: 0 });
}

export function buildExportBackground(
  backgroundPresetId: MindMapBackgroundPresetId,
  width: number,
  height: number,
): ExportBackground {
  switch (backgroundPresetId) {
    case "aurora-mesh":
      return {
        defs: `
    <linearGradient id="mindora-export-bg" x1="0%" x2="0%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#07171f" />
      <stop offset="100%" stop-color="#040d15" />
    </linearGradient>
    <radialGradient id="mindora-export-glow-a" cx="18%" cy="18%" r="34%">
      <stop offset="0%" stop-color="#4dd7c5" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#4dd7c5" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="mindora-export-glow-b" cx="82%" cy="14%" r="26%">
      <stop offset="0%" stop-color="#6d9cff" stop-opacity="0.24" />
      <stop offset="100%" stop-color="#6d9cff" stop-opacity="0" />
    </radialGradient>
    <pattern
      id="mindora-export-grid"
      width="40"
      height="40"
      patternUnits="userSpaceOnUse"
    >
      <path
        d="M 40 0 L 0 0 0 40"
        fill="none"
        stroke="#7eebda"
        stroke-opacity="0.04"
        stroke-width="1"
      />
    </pattern>
  `,
        markup: `
  <rect width="${width}" height="${height}" fill="url(#mindora-export-bg)" />
  <rect width="${width}" height="${height}" fill="url(#mindora-export-glow-a)" />
  <rect width="${width}" height="${height}" fill="url(#mindora-export-glow-b)" />
  <rect width="${width}" height="${height}" fill="url(#mindora-export-grid)" />
`,
      };
    case "ember-glow":
      return {
        defs: `
    <linearGradient id="mindora-export-bg" x1="0%" x2="0%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#1d0f13" />
      <stop offset="100%" stop-color="#0d080b" />
    </linearGradient>
    <radialGradient id="mindora-export-glow-a" cx="22%" cy="18%" r="32%">
      <stop offset="0%" stop-color="#ffac75" stop-opacity="0.28" />
      <stop offset="100%" stop-color="#ffac75" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="mindora-export-glow-b" cx="82%" cy="16%" r="25%">
      <stop offset="0%" stop-color="#ff7a72" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#ff7a72" stop-opacity="0" />
    </radialGradient>
    <pattern
      id="mindora-export-grid"
      width="44"
      height="44"
      patternUnits="userSpaceOnUse"
    >
      <path
        d="M 44 0 L 0 0 0 44"
        fill="none"
        stroke="#ffdcbc"
        stroke-opacity="0.035"
        stroke-width="1"
      />
    </pattern>
  `,
        markup: `
  <rect width="${width}" height="${height}" fill="url(#mindora-export-bg)" />
  <rect width="${width}" height="${height}" fill="url(#mindora-export-glow-a)" />
  <rect width="${width}" height="${height}" fill="url(#mindora-export-glow-b)" />
  <rect width="${width}" height="${height}" fill="url(#mindora-export-grid)" />
`,
      };
    case "evergreen-grid":
      return {
        defs: `
    <linearGradient id="mindora-export-bg" x1="0%" x2="0%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#091714" />
      <stop offset="100%" stop-color="#040c0a" />
    </linearGradient>
    <radialGradient id="mindora-export-glow-a" cx="20%" cy="18%" r="34%">
      <stop offset="0%" stop-color="#58bb99" stop-opacity="0.28" />
      <stop offset="100%" stop-color="#58bb99" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="mindora-export-glow-b" cx="78%" cy="12%" r="26%">
      <stop offset="0%" stop-color="#8fcdad" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#8fcdad" stop-opacity="0" />
    </radialGradient>
    <pattern
      id="mindora-export-grid"
      width="46"
      height="46"
      patternUnits="userSpaceOnUse"
    >
      <path
        d="M 46 0 L 0 0 0 46"
        fill="none"
        stroke="#b2f7da"
        stroke-opacity="0.03"
        stroke-width="1"
      />
    </pattern>
  `,
        markup: `
  <rect width="${width}" height="${height}" fill="url(#mindora-export-bg)" />
  <rect width="${width}" height="${height}" fill="url(#mindora-export-glow-a)" />
  <rect width="${width}" height="${height}" fill="url(#mindora-export-glow-b)" />
  <rect width="${width}" height="${height}" fill="url(#mindora-export-grid)" />
`,
      };
    case "nocturne-dots":
      return {
        defs: `
    <linearGradient id="mindora-export-bg" x1="0%" x2="0%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#0b0c1e" />
      <stop offset="100%" stop-color="#060712" />
    </linearGradient>
    <radialGradient id="mindora-export-glow-a" cx="20%" cy="18%" r="34%">
      <stop offset="0%" stop-color="#846eff" stop-opacity="0.24" />
      <stop offset="100%" stop-color="#846eff" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="mindora-export-glow-b" cx="78%" cy="14%" r="26%">
      <stop offset="0%" stop-color="#5eabff" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#5eabff" stop-opacity="0" />
    </radialGradient>
    <pattern
      id="mindora-export-dots"
      width="36"
      height="36"
      patternUnits="userSpaceOnUse"
    >
      <circle cx="18" cy="18" r="1.2" fill="#ffffff" fill-opacity="0.12" />
    </pattern>
  `,
        markup: `
  <rect width="${width}" height="${height}" fill="url(#mindora-export-bg)" />
  <rect width="${width}" height="${height}" fill="url(#mindora-export-glow-a)" />
  <rect width="${width}" height="${height}" fill="url(#mindora-export-glow-b)" />
  <rect width="${width}" height="${height}" fill="url(#mindora-export-dots)" />
`,
      };
    case "midnight-grid":
    default:
      return {
        defs: `
    <linearGradient id="mindora-export-bg" x1="0%" x2="0%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#0a101c" />
      <stop offset="100%" stop-color="#08101a" />
    </linearGradient>
    <radialGradient id="mindora-export-glow-a" cx="0%" cy="0%" r="58%">
      <stop offset="0%" stop-color="#3c5a98" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#3c5a98" stop-opacity="0" />
    </radialGradient>
    <pattern
      id="mindora-export-grid"
      width="44"
      height="44"
      patternUnits="userSpaceOnUse"
    >
      <path
        d="M 44 0 L 0 0 0 44"
        fill="none"
        stroke="#ffffff"
        stroke-opacity="0.03"
        stroke-width="1"
      />
    </pattern>
  `,
        markup: `
  <rect width="${width}" height="${height}" fill="url(#mindora-export-bg)" />
  <rect width="${width}" height="${height}" fill="url(#mindora-export-glow-a)" />
  <rect width="${width}" height="${height}" fill="url(#mindora-export-grid)" />
`,
      };
  }
}
