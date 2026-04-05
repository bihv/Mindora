export const EXPORT_FORMATS = ["png", "svg", "pdf"] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  png: "PNG",
  svg: "SVG",
  pdf: "PDF",
};
