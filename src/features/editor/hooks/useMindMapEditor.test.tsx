import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SaveMindMapExportFileParams } from "../../../platform/files/types";

const { exportBlobMock, saveExportMock } = vi.hoisted(() => ({
  exportBlobMock: vi.fn(),
  saveExportMock: vi.fn(),
}));

vi.mock("../../../platform/files/draftStore", async () => {
  const actual = await vi.importActual<
    typeof import("../../../platform/files/draftStore")
  >("../../../platform/files/draftStore");

  return {
    ...actual,
    clearStoredMindMapDraft: vi.fn(),
    loadStoredMindMapDraft: vi.fn(() => null),
    saveMindMapDraft: vi.fn(),
  };
});

vi.mock("../../../platform/files/recentFilesStore", async () => {
  const actual = await vi.importActual<
    typeof import("../../../platform/files/recentFilesStore")
  >("../../../platform/files/recentFilesStore");

  return {
    ...actual,
    loadRecentMindMapFiles: vi.fn(() => []),
  };
});

vi.mock("../../../platform/files/repository", async () => {
  const actual = await vi.importActual<
    typeof import("../../../platform/files/repository")
  >("../../../platform/files/repository");

  return {
    ...actual,
    openMindMapFile: vi.fn(),
    openMindMapFileFromPath: vi.fn(),
    saveMindMapExportFile: saveExportMock,
    saveMindMapFile: vi.fn(),
    serializeMindMapDocument: actual.serializeMindMapDocument,
  };
});

vi.mock("../../export", async () => {
  const actual = await vi.importActual<typeof import("../../export")>(
    "../../export",
  );

  return {
    ...actual,
    buildMindMapExportBlob: exportBlobMock,
  };
});

import { useMindMapEditor } from "./useMindMapEditor";

describe("useMindMapEditor", () => {
  beforeEach(() => {
    exportBlobMock.mockReset();
    saveExportMock.mockReset();
    exportBlobMock.mockResolvedValue(new Blob(["svg"], { type: "image/svg+xml" }));
    saveExportMock.mockResolvedValue("map.svg");
  });

  it("keeps public editor facade working after internal hook split", async () => {
    const centerOnNode = vi.fn(() => true);
    const { result } = renderHook(() => useMindMapEditor({ centerOnNode }));

    expect(result.current.selectedNode.id).toBe(result.current.mindMap.rootId);
    expect(typeof result.current.handleOpenFile).toBe("function");

    act(() => {
      result.current.handleAddChild(result.current.selectedNode.id);
    });

    expect(Object.keys(result.current.mindMap.nodes)).toHaveLength(2);

    act(() => {
      result.current.undo();
    });
    expect(Object.keys(result.current.mindMap.nodes)).toHaveLength(1);

    act(() => {
      result.current.redo();
    });
    expect(Object.keys(result.current.mindMap.nodes)).toHaveLength(2);

    await act(async () => {
      await result.current.handleExportFile("svg");
    });

    const exportRequest = saveExportMock.mock
      .calls[0]?.[0] as SaveMindMapExportFileParams | undefined;
    expect(exportRequest).toBeDefined();
    expect(typeof exportRequest?.createContents).toBe("function");
    expect(exportRequest?.documentTitle).toBe(result.current.mindMap.title);
    expect(exportRequest?.format).toBe("svg");
  });
});
