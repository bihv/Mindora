import type { MindMapDocument } from "../../domain/mindmap/model";
import type { ExportFormat } from "../../features/export/types";
import {
  MINDORA_FILE_MIME_TYPE,
  serializeMindMapFileContents,
} from "../../features/editor/secureFile";
import {
  buildMindMapExportFileName,
  buildMindMapFileName,
  getExportFileDescriptor,
  getMindMapPickerFileTypes,
} from "./fileNames";
import type {
  BrowserFileHandle,
  OpenMindMapFileResult,
  SaveMindMapFileResult,
  WindowWithFilePicker,
} from "./types";

export async function openMindMapFileBrowser(
  parseMindMapDocument: (contents: string) => Promise<MindMapDocument>,
  serializeMindMapDocument: (document: MindMapDocument) => string,
): Promise<OpenMindMapFileResult | null> {
  const pickerWindow = window as WindowWithFilePicker;

  if (typeof pickerWindow.showOpenFilePicker === "function") {
    const [fileHandle] = await pickerWindow.showOpenFilePicker({
      excludeAcceptAllOption: true,
      multiple: false,
      types: getMindMapPickerFileTypes(),
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

export async function saveMindMapFileBrowser(params: {
  document: MindMapDocument;
  existingFileHandle: BrowserFileHandle | null;
  serializeMindMapDocument: (document: MindMapDocument) => string;
}): Promise<SaveMindMapFileResult | null> {
  const { document, existingFileHandle, serializeMindMapDocument } = params;
  const fileContents = await serializeMindMapFileContents(document);
  const snapshotContents = serializeMindMapDocument(document);

  const pickerWindow = window as WindowWithFilePicker;

  if (existingFileHandle) {
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
      types: getMindMapPickerFileTypes(),
    });
    await writeToHandle(fileHandle, fileContents);
    const file = await fileHandle.getFile();

    return {
      contents: snapshotContents,
      fileHandle,
      fileName: file.name,
    };
  }

  downloadFile(
    buildMindMapFileName(document.title),
    fileContents,
    MINDORA_FILE_MIME_TYPE,
  );

  return {
    contents: snapshotContents,
    fileHandle: null,
    fileName: buildMindMapFileName(document.title),
  };
}

export async function saveMindMapExportFileBrowser(params: {
  createContents: () => Promise<Blob>;
  documentTitle: string;
  format: ExportFormat;
}): Promise<string | null> {
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
    const contents = await params.createContents();
    await writeToHandle(fileHandle, contents);
    const file = await fileHandle.getFile();

    return file.name;
  }

  const contents = await params.createContents();
  downloadFile(fileName, contents);
  return fileName;
}

async function pickFileWithInput(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".mindora,application/x-mindora";

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
