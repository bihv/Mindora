import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import type { MindMapDocument } from "../../domain/mindmap/model";
import type { ExportFormat } from "../../features/export/types";
import {
  MINDORA_FILE_EXTENSION,
  parseMindMapFileContents,
  serializeMindMapFileContents,
} from "../../features/editor/secureFile";
import {
  buildMindMapExportFileName,
  buildMindMapFileName,
  ensureFileExtension,
  getExportFileDescriptor,
  getFileNameFromPath,
} from "./fileNames";
import { rememberRecentMindMapFile } from "./recentFilesStore";
import type { OpenMindMapFileResult, SaveMindMapFileResult } from "./types";

export async function openMindMapFileDesktop(
  serializeMindMapDocument: (document: MindMapDocument) => string,
): Promise<OpenMindMapFileResult | null> {
  const selectedPath = await openDialog({
    filters: [
      {
        name: "Mindora map",
        extensions: [MINDORA_FILE_EXTENSION],
      },
    ],
    multiple: false,
    title: "Open Mindora Map",
  });

  if (!selectedPath || Array.isArray(selectedPath)) {
    return null;
  }

  return readMindMapFileDesktop(selectedPath, serializeMindMapDocument);
}

export async function openMindMapFileFromPathDesktop(
  path: string,
  serializeMindMapDocument: (document: MindMapDocument) => string,
): Promise<OpenMindMapFileResult> {
  return readMindMapFileDesktop(path, serializeMindMapDocument);
}

export async function saveMindMapFileDesktop(params: {
  document: MindMapDocument;
  existingFileHandle: string | null;
  serializeMindMapDocument: (document: MindMapDocument) => string;
}): Promise<SaveMindMapFileResult | null> {
  const { document, existingFileHandle, serializeMindMapDocument } = params;
  const contents = await serializeMindMapFileContents(document);
  const snapshotContents = serializeMindMapDocument(document);
  const selectedPath =
    existingFileHandle ??
    (await saveDialog({
      defaultPath: buildMindMapFileName(document.title),
      filters: [
        {
          name: "Mindora map",
          extensions: [MINDORA_FILE_EXTENSION],
        },
      ],
      title: "Save Mindora Map",
    }));

  if (!selectedPath) {
    return null;
  }

  const filePath = ensureFileExtension(selectedPath, MINDORA_FILE_EXTENSION);

  await invoke("write_mindmap_file", {
    contents,
    path: filePath,
  });
  rememberRecentMindMapFile(filePath);

  return {
    contents: snapshotContents,
    fileHandle: filePath,
    fileName: getFileNameFromPath(filePath),
  };
}

export async function saveMindMapExportFileDesktop(params: {
  createContents: () => Promise<Blob>;
  documentTitle: string;
  format: ExportFormat;
}): Promise<string | null> {
  const fileDescriptor = getExportFileDescriptor(params.format);
  const selectedPath = await saveDialog({
    defaultPath: buildMindMapExportFileName(params.documentTitle, params.format),
    filters: [
      {
        name: fileDescriptor.description,
        extensions: [fileDescriptor.extension],
      },
    ],
    title: fileDescriptor.title,
  });

  if (!selectedPath) {
    return null;
  }

  const filePath = ensureFileExtension(selectedPath, fileDescriptor.extension);
  const blob = await params.createContents();
  const contents = new Uint8Array(await blob.arrayBuffer());

  await invoke("write_binary_file", {
    contents: Array.from(contents),
    path: filePath,
  });

  return getFileNameFromPath(filePath);
}

async function readMindMapFileDesktop(
  path: string,
  serializeMindMapDocument: (document: MindMapDocument) => string,
): Promise<OpenMindMapFileResult> {
  const contents = await invoke<string>("read_mindmap_file", {
    path,
  });
  const document = await parseMindMapFileContents(contents);
  rememberRecentMindMapFile(path);

  return {
    contents: serializeMindMapDocument(document),
    document,
    fileHandle: path,
    fileName: getFileNameFromPath(path),
  };
}
