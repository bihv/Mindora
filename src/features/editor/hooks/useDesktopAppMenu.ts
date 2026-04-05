import { useEffect } from "react";
import { isTauri } from "@tauri-apps/api/core";
import {
  CheckMenuItem,
  Menu,
  MenuItem,
  PredefinedMenuItem,
  Submenu,
} from "@tauri-apps/api/menu";
import type { ExportFormat } from "../exportTypes";

type UseDesktopAppMenuArgs = {
  canRedo: boolean;
  canUndo: boolean;
  currentFileName: string | null;
  isFileActionPending: boolean;
  isOutlineOpen: boolean;
  onAutoLayout: () => void;
  onExportFile: (format: ExportFormat) => Promise<void> | void;
  onOpenBackgroundDialog: () => void;
  onOpenLayoutDialog: () => void;
  onNewMindMap: () => void;
  onOpenFile: () => Promise<void> | void;
  onRedo: () => void;
  onSaveFile: () => Promise<void> | void;
  onToggleOutline: () => void;
  onUndo: () => void;
};

type DesktopAppMenu = {
  autoLayoutItem: MenuItem;
  backgroundItem: MenuItem;
  exportPdfItem: MenuItem;
  exportPngItem: MenuItem;
  exportSvgItem: MenuItem;
  mindMapTypeItem: MenuItem;
  menu: Menu;
  newMindMapItem: MenuItem;
  openItem: MenuItem;
  outlineItem: CheckMenuItem;
  redoItem: MenuItem;
  saveItem: MenuItem;
  undoItem: MenuItem;
};

type DesktopAppMenuRegistry = {
  latestArgs: UseDesktopAppMenuArgs | null;
  menuPromise?: Promise<DesktopAppMenu>;
};

declare global {
  interface Window {
    __mindoraDesktopMenu?: DesktopAppMenuRegistry;
  }
}

export function useDesktopAppMenu(args: UseDesktopAppMenuArgs): boolean {
  const desktopMenuEnabled = isTauri();

  if (desktopMenuEnabled) {
    getDesktopAppMenuRegistry().latestArgs = args;
  }

  useEffect(() => {
    if (!desktopMenuEnabled) {
      return;
    }

    const registry = getDesktopAppMenuRegistry();
    registry.menuPromise ??= createDesktopAppMenu().catch((error) => {
      if (window.__mindoraDesktopMenu) {
        window.__mindoraDesktopMenu.menuPromise = undefined;
      }
      throw error;
    });

    void registry.menuPromise
      .then((menu) => syncDesktopAppMenu(menu, registry.latestArgs ?? args))
      .catch(logDesktopMenuError);
  }, [
    args.canRedo,
    args.canUndo,
    args.currentFileName,
    args.isFileActionPending,
    args.isOutlineOpen,
    desktopMenuEnabled,
  ]);

  return desktopMenuEnabled;
}

async function createDesktopAppMenu(
): Promise<DesktopAppMenu> {
  const [
    newMindMapItem,
    openItem,
    saveItem,
    exportPngItem,
    exportSvgItem,
    exportPdfItem,
    undoItem,
    redoItem,
    outlineItem,
    mindMapTypeItem,
    backgroundItem,
    autoLayoutItem,
    fileSeparator,
    exportSeparator,
    editSeparator,
    layoutSeparator,
    closeWindowItem,
    cutItem,
    copyItem,
    pasteItem,
    selectAllItem,
  ] = await Promise.all([
    MenuItem.new({
      id: "file-new-mindmap",
      text: "New Mindmap",
      accelerator: "CmdOrCtrl+N",
      action: () => {
        getDesktopAppMenuRegistry().latestArgs?.onNewMindMap();
      },
    }),
    MenuItem.new({
      id: "file-open",
      text: "Open...",
      accelerator: "CmdOrCtrl+O",
      action: () => {
        void getDesktopAppMenuRegistry().latestArgs?.onOpenFile();
      },
    }),
    MenuItem.new({
      id: "file-save",
      text: "Save",
      accelerator: "CmdOrCtrl+S",
      action: () => {
        void getDesktopAppMenuRegistry().latestArgs?.onSaveFile();
      },
    }),
    MenuItem.new({
      id: "file-export-png",
      text: "PNG...",
      action: () => {
        void getDesktopAppMenuRegistry().latestArgs?.onExportFile("png");
      },
    }),
    MenuItem.new({
      id: "file-export-svg",
      text: "SVG...",
      action: () => {
        void getDesktopAppMenuRegistry().latestArgs?.onExportFile("svg");
      },
    }),
    MenuItem.new({
      id: "file-export-pdf",
      text: "PDF...",
      action: () => {
        void getDesktopAppMenuRegistry().latestArgs?.onExportFile("pdf");
      },
    }),
    MenuItem.new({
      id: "edit-undo",
      text: "Undo",
      accelerator: "CmdOrCtrl+Z",
      action: () => {
        getDesktopAppMenuRegistry().latestArgs?.onUndo();
      },
    }),
    MenuItem.new({
      id: "edit-redo",
      text: "Redo",
      accelerator: "CmdOrCtrl+Shift+Z",
      action: () => {
        getDesktopAppMenuRegistry().latestArgs?.onRedo();
      },
    }),
    CheckMenuItem.new({
      id: "view-outline",
      text: "Outline",
      checked: false,
      action: () => {
        getDesktopAppMenuRegistry().latestArgs?.onToggleOutline();
      },
    }),
    MenuItem.new({
      id: "layout-mindmap-type",
      text: "Mindmap Type...",
      action: () => {
        getDesktopAppMenuRegistry().latestArgs?.onOpenLayoutDialog();
      },
    }),
    MenuItem.new({
      id: "layout-background",
      text: "Background...",
      action: () => {
        getDesktopAppMenuRegistry().latestArgs?.onOpenBackgroundDialog();
      },
    }),
    MenuItem.new({
      id: "layout-auto",
      text: "Auto Layout",
      action: () => {
        getDesktopAppMenuRegistry().latestArgs?.onAutoLayout();
      },
    }),
    PredefinedMenuItem.new({ item: "Separator" }),
    PredefinedMenuItem.new({ item: "Separator" }),
    PredefinedMenuItem.new({ item: "Separator" }),
    PredefinedMenuItem.new({ item: "Separator" }),
    PredefinedMenuItem.new({ item: "CloseWindow" }),
    PredefinedMenuItem.new({ item: "Cut" }),
    PredefinedMenuItem.new({ item: "Copy" }),
    PredefinedMenuItem.new({ item: "Paste" }),
    PredefinedMenuItem.new({ item: "SelectAll" }),
  ]);

  const exportMenu = await Submenu.new({
    text: "Export",
    items: [exportPngItem, exportSvgItem, exportPdfItem],
  });

  const [fileMenu, editMenu, viewMenu, layoutMenu] = await Promise.all([
    Submenu.new({
      text: "File",
      items: [
        newMindMapItem,
        openItem,
        saveItem,
        fileSeparator,
        exportMenu,
        exportSeparator,
        closeWindowItem,
      ],
    }),
    Submenu.new({
      text: "Edit",
      items: [
        undoItem,
        redoItem,
        editSeparator,
        cutItem,
        copyItem,
        pasteItem,
        selectAllItem,
      ],
    }),
    Submenu.new({
      text: "View",
      items: [outlineItem],
    }),
    Submenu.new({
      text: "Layout",
      items: [mindMapTypeItem, backgroundItem, layoutSeparator, autoLayoutItem],
    }),
  ]);

  const menu = await Menu.new({
    items: [fileMenu, editMenu, viewMenu, layoutMenu],
  });

  await menu.setAsAppMenu();

  return {
    autoLayoutItem,
    backgroundItem,
    exportPdfItem,
    exportPngItem,
    exportSvgItem,
    mindMapTypeItem,
    menu,
    newMindMapItem,
    openItem,
    outlineItem,
    redoItem,
    saveItem,
    undoItem,
  };
}

async function syncDesktopAppMenu(
  menu: DesktopAppMenu,
  args: UseDesktopAppMenuArgs,
): Promise<void> {
  await Promise.all([
    menu.newMindMapItem.setEnabled(!args.isFileActionPending),
    menu.openItem.setEnabled(!args.isFileActionPending),
    menu.saveItem.setEnabled(!args.isFileActionPending),
    menu.saveItem.setText(args.currentFileName ? "Save" : "Save As..."),
    menu.exportPngItem.setEnabled(!args.isFileActionPending),
    menu.exportSvgItem.setEnabled(!args.isFileActionPending),
    menu.exportPdfItem.setEnabled(!args.isFileActionPending),
    menu.mindMapTypeItem.setEnabled(!args.isFileActionPending),
    menu.backgroundItem.setEnabled(!args.isFileActionPending),
    menu.undoItem.setEnabled(args.canUndo),
    menu.redoItem.setEnabled(args.canRedo),
    menu.outlineItem.setChecked(args.isOutlineOpen),
    menu.autoLayoutItem.setEnabled(!args.isFileActionPending),
  ]);
}

function logDesktopMenuError(error: unknown): void {
  console.error("Unable to sync the desktop menu.", error);
}

function getDesktopAppMenuRegistry(): DesktopAppMenuRegistry {
  window.__mindoraDesktopMenu ??= {
    latestArgs: null,
  };

  return window.__mindoraDesktopMenu;
}
