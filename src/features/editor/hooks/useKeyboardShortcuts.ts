import { useEffect } from "react";
import { isEditableTarget } from "../utils";

type UseKeyboardShortcutsArgs = {
  clearSelection: () => void;
  closeOutline: () => void;
  handleAddChild: (nodeId: string) => void;
  handleAddSibling: (nodeId: string) => void;
  handleDeleteSelected: () => void;
  hasActiveSelection: boolean;
  redo: () => void;
  selectedNodeId: string;
  selectedNodeIsRoot: boolean;
  undo: () => void;
};

export function useKeyboardShortcuts({
  clearSelection,
  closeOutline,
  handleAddChild,
  handleAddSibling,
  handleDeleteSelected,
  hasActiveSelection,
  redo,
  selectedNodeId,
  selectedNodeIsRoot,
  undo,
}: UseKeyboardShortcutsArgs) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMeta = event.metaKey || event.ctrlKey;
      const target = event.target;
      const typingTarget =
        target instanceof HTMLElement && isEditableTarget(target);

      if (isMeta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (isMeta && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }

      if (typingTarget) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        clearSelection();
        closeOutline();
        return;
      }

      if (!hasActiveSelection) {
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        handleAddChild(selectedNodeId);
      } else if (event.key === "Enter") {
        event.preventDefault();
        handleAddSibling(selectedNodeId);
      } else if (
        (event.key === "Delete" || event.key === "Backspace") &&
        !selectedNodeIsRoot
      ) {
        event.preventDefault();
        handleDeleteSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    clearSelection,
    closeOutline,
    handleAddChild,
    handleAddSibling,
    handleDeleteSelected,
    hasActiveSelection,
    redo,
    selectedNodeId,
    selectedNodeIsRoot,
    undo,
  ]);
}
