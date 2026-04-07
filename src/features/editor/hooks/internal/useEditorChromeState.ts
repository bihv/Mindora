import { useCallback, useState } from "react";
import type { MindMapBackgroundPresetId } from "../../../../domain/mindmap/backgroundPresets/presetCatalog";
import type { MindMapLayoutType } from "../../../../domain/mindmap/model";
import type { EditorChromeState } from "../../types";

const INITIAL_CHROME_STATE: EditorChromeState = {
  backgroundPanelInitialPresetId: null,
  isBackgroundDialogOpen: false,
  isInspectorOpen: false,
  isLayoutDialogOpen: false,
  isOutlineOpen: false,
  layoutPanelInitialLayoutType: null,
};

export function useEditorChromeState() {
  const [chromeState, setChromeState] =
    useState<EditorChromeState>(INITIAL_CHROME_STATE);

  const setIsOutlineOpen = useCallback((value: boolean) => {
    setChromeState((current) =>
      current.isOutlineOpen === value
        ? current
        : {
            ...current,
            isOutlineOpen: value,
          },
    );
  }, []);

  const setIsInspectorOpen = useCallback((value: boolean) => {
    setChromeState((current) =>
      current.isInspectorOpen === value
        ? current
        : {
            ...current,
            isInspectorOpen: value,
          },
    );
  }, []);

  const resetChromeState = useCallback(() => {
    setChromeState(INITIAL_CHROME_STATE);
  }, []);

  const toggleOutline = useCallback(() => {
    setChromeState((current) => ({
      ...current,
      isOutlineOpen: !current.isOutlineOpen,
    }));
  }, []);

  const openLayoutDialog = useCallback((layoutType: MindMapLayoutType) => {
    setChromeState((current) => ({
      ...current,
      backgroundPanelInitialPresetId: null,
      isBackgroundDialogOpen: false,
      isInspectorOpen: false,
      isLayoutDialogOpen: true,
      layoutPanelInitialLayoutType: current.isLayoutDialogOpen
        ? current.layoutPanelInitialLayoutType
        : layoutType,
    }));
  }, []);

  const closeLayoutDialog = useCallback(() => {
    setChromeState((current) => ({
      ...current,
      isLayoutDialogOpen: false,
      layoutPanelInitialLayoutType: null,
    }));
  }, []);

  const openBackgroundDialog = useCallback(
    (backgroundPresetId: MindMapBackgroundPresetId) => {
      setChromeState((current) => ({
        ...current,
        backgroundPanelInitialPresetId: current.isBackgroundDialogOpen
          ? current.backgroundPanelInitialPresetId
          : backgroundPresetId,
        isBackgroundDialogOpen: true,
        isInspectorOpen: false,
        isLayoutDialogOpen: false,
        layoutPanelInitialLayoutType: null,
      }));
    },
    [],
  );

  const closeBackgroundDialog = useCallback(() => {
    setChromeState((current) => ({
      ...current,
      backgroundPanelInitialPresetId: null,
      isBackgroundDialogOpen: false,
    }));
  }, []);

  return {
    ...chromeState,
    closeBackgroundDialog,
    closeLayoutDialog,
    openBackgroundDialog,
    openLayoutDialog,
    resetChromeState,
    setChromeState,
    setIsInspectorOpen,
    setIsOutlineOpen,
    toggleOutline,
  };
}
