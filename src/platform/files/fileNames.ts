import type { ExportFormat } from "../../features/export/types";
import {
  MINDORA_FILE_EXTENSION,
  MINDORA_FILE_EXTENSION_WITH_DOT,
  MINDORA_FILE_MIME_TYPE,
} from "../../features/editor/secureFile";

export function buildMindMapFileStem(title: string): string {
  const normalizedTitle = title.trim().toLowerCase();

  return normalizedTitle
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildMindMapFileName(title: string): string {
  return `${buildMindMapFileStem(title) || "mindora-map"}${MINDORA_FILE_EXTENSION_WITH_DOT}`;
}

export function buildMindMapExportFileName(
  title: string,
  format: ExportFormat,
): string {
  return `${buildMindMapFileStem(title) || "mindora-map"}.${format}`;
}

export function getExportFileDescriptor(format: ExportFormat): {
  description: string;
  extension: string;
  extensionWithDot: string;
  mimeType: string;
  title: string;
} {
  switch (format) {
    case "png":
      return {
        description: "PNG image",
        extension: "png",
        extensionWithDot: ".png",
        mimeType: "image/png",
        title: "Export Mindora Map as PNG",
      };
    case "svg":
      return {
        description: "SVG image",
        extension: "svg",
        extensionWithDot: ".svg",
        mimeType: "image/svg+xml",
        title: "Export Mindora Map as SVG",
      };
    case "pdf":
      return {
        description: "PDF document",
        extension: "pdf",
        extensionWithDot: ".pdf",
        mimeType: "application/pdf",
        title: "Export Mindora Map as PDF",
      };
  }
}

export function getMindMapPickerFileTypes() {
  return [
    {
      description: "Mindora map",
      accept: {
        [MINDORA_FILE_MIME_TYPE]: [MINDORA_FILE_EXTENSION_WITH_DOT],
      },
    },
  ];
}

export function getFileNameFromPath(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

export function ensureFileExtension(path: string, extension: string): string {
  return path.toLowerCase().endsWith(`.${extension.toLowerCase()}`)
    ? path
    : `${path}.${extension}`;
}

export { MINDORA_FILE_EXTENSION, MINDORA_FILE_EXTENSION_WITH_DOT };
