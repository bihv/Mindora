import { invoke, isTauri } from "@tauri-apps/api/core";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import {
  hydrateMindMapDocument,
  type MindMapDocument,
} from "../../mindmap";
import type { ExportFormat } from "./exportTypes";
import {
  MINDORA_FILE_EXTENSION,
  MINDORA_FILE_EXTENSION_WITH_DOT,
  MINDORA_FILE_MIME_TYPE,
  parseMindMapFileContents,
  serializeMindMapFileContents,
} from "./secureFile";

type BrowserFileWritable = {
  close: () => Promise<void>;
  write: (data: string | Blob) => Promise<void>;
};

export type BrowserFileHandle = {
  createWritable: () => Promise<BrowserFileWritable>;
  getFile: () => Promise<File>;
  name?: string;
};

export type MindMapFileHandle = BrowserFileHandle | string;
export type RecentMindMapFile = {
  accessedAt: number;
  fileName: string;
  path: string;
};

type PickerFileType = {
  accept: Record<string, string[]>;
  description?: string;
};

type OpenPickerOptions = {
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
  types?: PickerFileType[];
};

type SavePickerOptions = {
  excludeAcceptAllOption?: boolean;
  suggestedName?: string;
  types?: PickerFileType[];
};

type WindowWithFilePicker = Window &
  typeof globalThis & {
    showOpenFilePicker?: (
      options?: OpenPickerOptions,
    ) => Promise<BrowserFileHandle[]>;
    showSaveFilePicker?: (
      options?: SavePickerOptions,
    ) => Promise<BrowserFileHandle>;
  };

export type OpenMindMapFileResult = {
  contents: string;
  document: MindMapDocument;
  fileHandle: MindMapFileHandle | null;
  fileName: string;
};

export type SaveMindMapFileResult = {
  contents: string;
  fileHandle: MindMapFileHandle | null;
  fileName: string;
};

type SaveMindMapExportFileParams = {
  contents: Blob;
  documentTitle: string;
  format: ExportFormat;
};

const RECENT_FILES_KEY = "mindora:recent-files";
const MAX_RECENT_FILES = 8;

const FILE_TYPES = [
  {
    description: "Mindora map",
    accept: {
      [MINDORA_FILE_MIME_TYPE]: [MINDORA_FILE_EXTENSION_WITH_DOT],
    },
  },
] satisfies PickerFileType[];

export function serializeMindMapDocument(document: MindMapDocument): string {
  return JSON.stringify(hydrateMindMapDocument(document), null, 2);
}

export async function openMindMapFile(): Promise<OpenMindMapFileResult | null> {
  if (isTauri()) {
    return openMindMapFileDesktop();
  }

  const pickerWindow = window as WindowWithFilePicker;

  if (typeof pickerWindow.showOpenFilePicker === "function") {
    const [fileHandle] = await pickerWindow.showOpenFilePicker({
      excludeAcceptAllOption: true,
      multiple: false,
      types: FILE_TYPES,
    });
    if (!fileHandle) {
      return null;
    }

    const file = await fileHandle.getFile();
    const contents = await file.text();
    const document = await parseMindMapDocument(contents);

    return {
      contents: serializeMindMapDocument(document),
      document,
      fileHandle,
      fileName: file.name,
    };
  }

  const file = await pickFileWithInput();
  if (!file) {
    return null;
  }

  const contents = await file.text();
  const document = await parseMindMapDocument(contents);
  return {
    contents: serializeMindMapDocument(document),
    document,
    fileHandle: null,
    fileName: file.name,
  };
}

export async function openMindMapFileFromPath(
  path: string,
): Promise<OpenMindMapFileResult> {
  if (!isTauri()) {
    throw new Error("Opening a recent file by path is only available in the desktop app.");
  }

  return readMindMapFileDesktop(path);
}

export async function saveMindMapFile(params: {
  document: MindMapDocument;
  existingFileHandle: MindMapFileHandle | null;
}): Promise<SaveMindMapFileResult | null> {
  const { document, existingFileHandle } = params;
  const fileContents = await serializeMindMapFileContents(document);
  const snapshotContents = serializeMindMapDocument(document);

  if (isTauri()) {
    return saveMindMapFileDesktop({
      contents: fileContents,
      document,
      existingFileHandle:
        typeof existingFileHandle === "string" ? existingFileHandle : null,
      snapshotContents,
    });
  }

  const pickerWindow = window as WindowWithFilePicker;

  if (existingFileHandle && typeof existingFileHandle !== "string") {
    await writeToHandle(existingFileHandle, fileContents);
    const file = await existingFileHandle.getFile();

    return {
      contents: snapshotContents,
      fileHandle: existingFileHandle,
      fileName: file.name,
    };
  }

  if (typeof pickerWindow.showSaveFilePicker === "function") {
    const fileHandle = await pickerWindow.showSaveFilePicker({
      excludeAcceptAllOption: true,
      suggestedName: buildMindMapFileName(document.title),
      types: FILE_TYPES,
    });
    await writeToHandle(fileHandle, fileContents);
    const file = await fileHandle.getFile();

    return {
      contents: snapshotContents,
      fileHandle,
      fileName: file.name,
    };
  }

  downloadFile(buildMindMapFileName(document.title), fileContents, MINDORA_FILE_MIME_TYPE);
  return {
    contents: snapshotContents,
    fileHandle: null,
    fileName: buildMindMapFileName(document.title),
  };
}

export async function saveMindMapExportFile(
  params: SaveMindMapExportFileParams,
): Promise<string | null> {
  if (isTauri()) {
    return await saveMindMapExportFileDesktop(params);
  }

  const pickerWindow = window as WindowWithFilePicker;
  const fileDescriptor = getExportFileDescriptor(params.format);
  const fileName = buildMindMapExportFileName(
    params.documentTitle,
    params.format,
  );

  if (typeof pickerWindow.showSaveFilePicker === "function") {
    const fileHandle = await pickerWindow.showSaveFilePicker({
      excludeAcceptAllOption: true,
      suggestedName: fileName,
      types: [
        {
          description: fileDescriptor.description,
          accept: {
            [fileDescriptor.mimeType]: [fileDescriptor.extensionWithDot],
          },
        },
      ],
    });
    await writeToHandle(fileHandle, params.contents);
    const file = await fileHandle.getFile();

    return file.name;
  }

  downloadFile(fileName, params.contents);
  return fileName;
}

export function loadRecentMindMapFiles(): RecentMindMapFile[] {
  if (!isTauri()) {
    return [];
  }

  const raw = localStorage.getItem(RECENT_FILES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isRecentMindMapFile).slice(0, MAX_RECENT_FILES);
  } catch {
    return [];
  }
}

async function parseMindMapDocument(contents: string): Promise<MindMapDocument> {
  return parseMindMapFileContents(contents);
}

function buildMindMapFileStem(title: string): string {
  const normalizedTitle = title.trim().toLowerCase();

  return normalizedTitle
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildMindMapFileName(title: string): string {
  return `${buildMindMapFileStem(title) || "mindora-map"}${MINDORA_FILE_EXTENSION_WITH_DOT}`;
}

function buildMindMapExportFileName(
  title: string,
  format: ExportFormat,
): string {
  return `${buildMindMapFileStem(title) || "mindora-map"}.${format}`;
}

function getExportFileDescriptor(format: ExportFormat): {
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

async function openMindMapFileDesktop(): Promise<OpenMindMapFileResult | null> {
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

  return readMindMapFileDesktop(selectedPath);
}

async function saveMindMapFileDesktop(params: {
  contents: string;
  document: MindMapDocument;
  existingFileHandle: string | null;
  snapshotContents: string;
}): Promise<SaveMindMapFileResult | null> {
  const { contents, document, existingFileHandle, snapshotContents } = params;
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

async function saveMindMapExportFileDesktop(
  params: SaveMindMapExportFileParams,
): Promise<string | null> {
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
  const contents = new Uint8Array(await params.contents.arrayBuffer());

  await invoke("write_binary_file", {
    contents: Array.from(contents),
    path: filePath,
  });

  return getFileNameFromPath(filePath);
}

async function pickFileWithInput(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = `${MINDORA_FILE_EXTENSION_WITH_DOT},${MINDORA_FILE_MIME_TYPE}`;

    input.addEventListener(
      "change",
      () => {
        resolve(input.files?.[0] ?? null);
      },
      { once: true },
    );
    input.addEventListener(
      "cancel",
      () => {
        resolve(null);
      },
      { once: true },
    );

    input.click();
  });
}

async function writeToHandle(
  fileHandle: BrowserFileHandle,
  contents: string | Blob,
): Promise<void> {
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
}

function downloadFile(
  fileName: string,
  contents: string | Blob,
  mimeType = "application/octet-stream",
): void {
  const blob =
    typeof contents === "string"
      ? new Blob([contents], { type: mimeType })
      : contents;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();

  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 0);
}

function getFileNameFromPath(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

function ensureFileExtension(path: string, extension: string): string {
  return path.toLowerCase().endsWith(`.${extension.toLowerCase()}`)
    ? path
    : `${path}.${extension}`;
}

async function readMindMapFileDesktop(
  path: string,
): Promise<OpenMindMapFileResult> {
  const contents = await invoke<string>("read_mindmap_file", {
    path,
  });
  const document = await parseMindMapDocument(contents);
  rememberRecentMindMapFile(path);

  return {
    contents: serializeMindMapDocument(document),
    document,
    fileHandle: path,
    fileName: getFileNameFromPath(path),
  };
}

function rememberRecentMindMapFile(path: string): RecentMindMapFile[] {
  const nextRecentFiles = [
    {
      accessedAt: Date.now(),
      fileName: getFileNameFromPath(path),
      path,
    },
    ...loadRecentMindMapFiles().filter((recentFile) => recentFile.path !== path),
  ].slice(0, MAX_RECENT_FILES);

  localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(nextRecentFiles));

  return nextRecentFiles;
}

function isRecentMindMapFile(value: unknown): value is RecentMindMapFile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const recentFile = value as Partial<RecentMindMapFile>;

  return (
    typeof recentFile.accessedAt === "number" &&
    typeof recentFile.fileName === "string" &&
    typeof recentFile.path === "string"
  );
}
