import type { MindMapDocument } from "../../domain/mindmap/model";
import type { ExportFormat } from "../../features/export/types";

export type BrowserFileWritable = {
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

export type SaveMindMapExportFileParams = {
  createContents: () => Promise<Blob>;
  documentTitle: string;
  format: ExportFormat;
};

export type PickerFileType = {
  accept: Record<string, string[]>;
  description?: string;
};

export type OpenPickerOptions = {
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
  types?: PickerFileType[];
};

export type SavePickerOptions = {
  excludeAcceptAllOption?: boolean;
  suggestedName?: string;
  types?: PickerFileType[];
};

export type WindowWithFilePicker = Window &
  typeof globalThis & {
    showOpenFilePicker?: (
      options?: OpenPickerOptions,
    ) => Promise<BrowserFileHandle[]>;
    showSaveFilePicker?: (
      options?: SavePickerOptions,
    ) => Promise<BrowserFileHandle>;
  };
