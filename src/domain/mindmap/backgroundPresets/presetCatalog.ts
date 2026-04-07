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
