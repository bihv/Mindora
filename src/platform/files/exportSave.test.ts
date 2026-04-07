import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveMindMapExportFileDesktop } from "./tauriAdapter";

const { invokeMock, saveDialogMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  saveDialogMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
  save: saveDialogMock,
}));

vi.mock("../../features/editor/secureFile", () => ({
  MINDORA_FILE_EXTENSION: "mindora",
  parseMindMapFileContents: vi.fn(),
  serializeMindMapFileContents: vi.fn(),
}));

describe("export save flow", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    saveDialogMock.mockReset();
  });

  it("asks for the destination before generating export contents", async () => {
    const steps: string[] = [];
    saveDialogMock.mockImplementation(() => {
      steps.push("dialog");
      return Promise.resolve("/tmp/exported-map");
    });
    invokeMock.mockResolvedValue(undefined);

    const result = await saveMindMapExportFileDesktop({
      createContents: () => {
        steps.push("blob");
        return Promise.resolve(new Blob(["demo"], { type: "text/plain" }));
      },
      documentTitle: "Roadmap",
      format: "png",
    });

    expect(result).toBe("exported-map.png");
    expect(steps).toEqual(["dialog", "blob"]);
    expect(invokeMock).toHaveBeenCalledWith("write_binary_file", {
      contents: [100, 101, 109, 111],
      path: "/tmp/exported-map.png",
    });
  });
});
