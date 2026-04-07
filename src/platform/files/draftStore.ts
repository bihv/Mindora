import {
  hydrateMindMapDocument,
  isMindMapDocument,
} from "../../domain/mindmap/documents";
import type {
  MindMapDocument,
  StoredMindMapDraft,
} from "../../domain/mindmap/model";

const STORAGE_KEY = "mindora:mvp-document";
const TEMPLATE_KEY = "mindora:active-template";

export function loadStoredMindMapDraft(): StoredMindMapDraft | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isStoredMindMapDraft(parsed)) {
      return {
        ...parsed,
        document: hydrateMindMapDocument(parsed.document),
      };
    }

    if (isMindMapDocument(parsed)) {
      const document = hydrateMindMapDocument(parsed);
      return {
        document,
        draftBaselineSnapshot: serializeStoredMindMapDocument(document),
        fileHandlePath: null,
        fileName: null,
        lastSavedSnapshot: null,
        updatedAt: null,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function saveMindMapDraft(draft: StoredMindMapDraft): void {
  const normalizedDraft: StoredMindMapDraft = {
    ...draft,
    document: hydrateMindMapDocument(draft.document),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedDraft));
}

export function clearStoredMindMapDraft(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function loadStoredMindMap(): MindMapDocument | null {
  return loadStoredMindMapDraft()?.document ?? null;
}

export function saveMindMap(document: MindMapDocument): void {
  saveMindMapDraft({
    document,
    draftBaselineSnapshot: serializeStoredMindMapDocument(document),
    fileHandlePath: null,
    fileName: null,
    lastSavedSnapshot: null,
    updatedAt: Date.now(),
  });
}

export function loadStoredTemplateId(): string | null {
  return localStorage.getItem(TEMPLATE_KEY);
}

export function saveTemplateId(templateId: string): void {
  localStorage.setItem(TEMPLATE_KEY, templateId);
}

function isStoredMindMapDraft(value: unknown): value is StoredMindMapDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const draft = value as Partial<StoredMindMapDraft>;

  return (
    isMindMapDocument(draft.document) &&
    (draft.draftBaselineSnapshot === null ||
      typeof draft.draftBaselineSnapshot === "string") &&
    (draft.fileHandlePath === null || typeof draft.fileHandlePath === "string") &&
    (draft.fileName === null || typeof draft.fileName === "string") &&
    (draft.lastSavedSnapshot === null ||
      typeof draft.lastSavedSnapshot === "string") &&
    (draft.updatedAt === null || typeof draft.updatedAt === "number")
  );
}

function serializeStoredMindMapDocument(document: MindMapDocument): string {
  return JSON.stringify(hydrateMindMapDocument(document), null, 2);
}
