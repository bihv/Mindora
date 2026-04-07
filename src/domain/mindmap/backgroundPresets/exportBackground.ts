import type { MindMapBackgroundPresetId } from "./presetCatalog";

export type ExportBackground = {
  defs: string;
  markup: string;
};

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
