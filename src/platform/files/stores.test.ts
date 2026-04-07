import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBlankMindMap } from "../../domain/mindmap/documents";
import { setMindMapNodeKind } from "../../domain/mindmap/nodeContent";
import {
  clearStoredMindMapDraft,
  loadStoredMindMapDraft,
  loadStoredTemplateId,
  saveMindMapDraft,
  saveTemplateId,
} from "./draftStore";
import {
  loadRecentMindMapFiles,
  rememberRecentMindMapFile,
} from "./recentFilesStore";

vi.mock("@tauri-apps/api/core", () => ({
  isTauri: vi.fn(() => true),
  invoke: vi.fn(),
}));

describe("platform file stores", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists and hydrates recoverable drafts", () => {
    const document = createBlankMindMap("Draft");
    const rootNode = document.nodes[document.rootId];
    document.nodes[document.rootId] = {
      ...setMindMapNodeKind(rootNode, "image"),
      data: { imageUrl: "" },
    };

    saveMindMapDraft({
      document,
      draftBaselineSnapshot: null,
      fileHandlePath: null,
      fileName: null,
      lastSavedSnapshot: null,
      updatedAt: Date.now(),
    });

    const recovered = loadStoredMindMapDraft();
    expect(recovered?.document.nodes[document.rootId].data).toEqual({
      imageUrl: "",
    });

    clearStoredMindMapDraft();
    expect(loadStoredMindMapDraft()).toBeNull();
  });

  it("tracks recent files and template preference in local storage", () => {
    rememberRecentMindMapFile("/tmp/roadmap.mindora");
    rememberRecentMindMapFile("/tmp/brainstorm.mindora");
    saveTemplateId("weekly-review");

    expect(loadRecentMindMapFiles().map((file) => file.fileName)).toEqual([
      "brainstorm.mindora",
      "roadmap.mindora",
    ]);
    expect(loadStoredTemplateId()).toBe("weekly-review");
  });
});
