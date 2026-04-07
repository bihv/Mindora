import { isTauri } from "@tauri-apps/api/core";
import { hydrateMindMapDocument } from "../../domain/mindmap/documents";
import type { MindMapDocument } from "../../domain/mindmap/model";
import { parseMindMapFileContents } from "../../features/editor/secureFile";
import type { ExportFormat } from "../../features/export/types";
import {
  openMindMapFileBrowser,
  saveMindMapExportFileBrowser,
  saveMindMapFileBrowser,
} from "./browserAdapter";
import { loadRecentMindMapFiles } from "./recentFilesStore";
import {
  openMindMapFileDesktop,
  openMindMapFileFromPathDesktop,
  saveMindMapExportFileDesktop,
  saveMindMapFileDesktop,
} from "./tauriAdapter";
import type {
  MindMapFileHandle,
  OpenMindMapFileResult,
  SaveMindMapFileResult,
} from "./types";

export function serializeMindMapDocument(document: MindMapDocument): string {
  return JSON.stringify(hydrateMindMapDocument(document), null, 2);
}

export async function openMindMapFile(): Promise<OpenMindMapFileResult | null> {
  if (isTauri()) {
    return openMindMapFileDesktop(serializeMindMapDocument);
  }

  return openMindMapFileBrowser(parseMindMapDocument, serializeMindMapDocument);
}

export async function openMindMapFileFromPath(
  path: string,
): Promise<OpenMindMapFileResult> {
  if (!isTauri()) {
    throw new Error(
      "Opening a recent file by path is only available in the desktop app.",
    );
  }

  return openMindMapFileFromPathDesktop(path, serializeMindMapDocument);
}

export async function saveMindMapFile(params: {
  document: MindMapDocument;
  existingFileHandle: MindMapFileHandle | null;
}): Promise<SaveMindMapFileResult | null> {
  const { document, existingFileHandle } = params;

  if (isTauri()) {
    return saveMindMapFileDesktop({
      document,
      existingFileHandle:
        typeof existingFileHandle === "string" ? existingFileHandle : null,
      serializeMindMapDocument,
    });
  }

  return saveMindMapFileBrowser({
    document,
    existingFileHandle:
      typeof existingFileHandle === "string" ? null : existingFileHandle,
    serializeMindMapDocument,
  });
}

export async function saveMindMapExportFile(params: {
  createContents: () => Promise<Blob>;
  documentTitle: string;
  format: ExportFormat;
}): Promise<string | null> {
  if (isTauri()) {
    return saveMindMapExportFileDesktop(params);
  }

  return saveMindMapExportFileBrowser(params);
}

async function parseMindMapDocument(
  contents: string,
): Promise<MindMapDocument> {
  return parseMindMapFileContents(contents);
}

export { loadRecentMindMapFiles };
