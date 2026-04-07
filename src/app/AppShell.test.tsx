import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
  isTauri: vi.fn(() => false),
}));

vi.mock("@tauri-apps/api/menu", () => ({
  CheckMenuItem: class {},
  Menu: class {},
  MenuItem: class {},
  PredefinedMenuItem: class {},
  Submenu: class {},
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: vi.fn(),
}));

vi.mock("yet-another-react-lightbox", () => ({
  default: () => null,
}));

vi.mock("yet-another-react-lightbox/plugins/zoom", () => ({
  default: {},
}));

describe("AppShell", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("moves from startup launcher into the editor workspace", async () => {
    render(<AppShell />);

    expect(
      screen.getByRole("heading", { name: /open a recent map or start fresh/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /new mindmap/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/zoom in/i)).toBeInTheDocument();
    });
  });
});
