import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { centerOnCanvasNodeMock, invokeMock, isTauriMock } = vi.hoisted(() => ({
  centerOnCanvasNodeMock: vi.fn(() => true),
  invokeMock: vi.fn(),
  isTauriMock: vi.fn(() => false),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
  isTauri: isTauriMock,
}));

vi.mock("../hooks/useCanvasState", () => ({
  useCanvasState: () => ({
    camera: { scale: 1, x: 0, y: 0 },
    centerOnNode: centerOnCanvasNodeMock,
    fitToBounds: vi.fn(() => true),
    handleViewportWheel: vi.fn(),
    latestDocumentRef: { current: null },
    panning: null,
    setCamera: vi.fn(),
    startPanning: vi.fn(),
    viewportRef: vi.fn(),
    viewportSize: { height: 768, width: 1280 },
    zoomIn: vi.fn(() => true),
    zoomOut: vi.fn(() => true),
  }),
}));

vi.mock("../hooks/useDesktopAppMenu", () => ({
  useDesktopAppMenu: vi.fn(),
}));

vi.mock("../hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock("../hooks/useWindowTitle", () => ({
  useWindowTitle: vi.fn(),
}));

import { useMindMapAppModel } from "./useMindMapAppModel";

describe("useMindMapAppModel", () => {
  beforeEach(() => {
    centerOnCanvasNodeMock.mockClear();
    invokeMock.mockReset();
    invokeMock.mockResolvedValue(null);
    isTauriMock.mockReturnValue(false);
  });

  it("wires center node through workspace controls after startup", () => {
    const { result } = renderHook(() => useMindMapAppModel());

    expect(result.current.startupScreen).not.toBeNull();

    act(() => {
      result.current.startupScreen?.onCreateMindMap();
    });

    expect(result.current.workspace).not.toBeNull();

    act(() => {
      result.current.workspace?.viewportControls.onCenterSelected();
    });

    expect(centerOnCanvasNodeMock).toHaveBeenCalledWith(
      result.current.workspace?.canvasStage.selectedNodeId,
    );
    expect(result.current.workspace?.minimap).not.toBeNull();
    expect(result.current.workspace?.nodeContextMenu.left).toBeTypeOf("number");
    expect(result.current.workspace?.nodeContextMenu.top).toBeTypeOf("number");
  });

  it("keeps center node available after clearing the active selection", () => {
    const { result } = renderHook(() => useMindMapAppModel());

    act(() => {
      result.current.startupScreen?.onCreateMindMap();
    });

    centerOnCanvasNodeMock.mockClear();

    act(() => {
      result.current.workspace?.canvasStage.onCanvasClick();
    });

    expect(result.current.workspace?.viewportControls.canCenterSelected).toBe(
      true,
    );

    act(() => {
      result.current.workspace?.viewportControls.onCenterSelected();
    });

    expect(centerOnCanvasNodeMock).toHaveBeenCalledWith(
      result.current.workspace?.canvasStage.selectedNodeId,
    );
  });

  it("opens the desktop AI flow from startup and workspace entry points", async () => {
    isTauriMock.mockReturnValue(true);

    const { result } = renderHook(() => useMindMapAppModel());

    expect(result.current.aiDialog.isAvailable).toBe(true);

    act(() => {
      result.current.startupScreen?.onCreateAiMindMap();
    });

    await waitFor(() => {
      expect(result.current.aiDialog.isOpen).toBe(true);
    });

    act(() => {
      result.current.aiDialog.onClose();
    });

    act(() => {
      result.current.startupScreen?.onCreateMindMap();
    });

    act(() => {
      result.current.workspace?.viewportControls.onGenerateAiMap?.();
    });

    await waitFor(() => {
      expect(result.current.aiDialog.isOpen).toBe(true);
    });
  });
});
