import { isTauri } from "@tauri-apps/api/core";
import { useCallback, useMemo, useState } from "react";
import type { MindMapDocument, MindMapLayoutType } from "../../../../domain/mindmap/model";
import { buildAiMindMapDocument } from "../../../ai/buildMindMapDocument";
import {
  generateMindMapOutline,
  normalizeAiConnection,
} from "../../../../platform/ai/openAiCompatibleClient";
import {
  loadAiConnectionSettings,
  saveAiConnectionSettings,
} from "../../../../platform/ai/settingsStore";
import {
  deleteStoredAiApiKey,
  getStoredAiApiKey,
  setStoredAiApiKey,
} from "../../../../platform/ai/secretStore";

type AiDialogState = {
  apiKey: string;
  endpointUrl: string;
  isOpen: boolean;
  isPending: boolean;
  lastError: string | null;
  model: string;
  remember: boolean;
  sourceText: string;
  topic: string;
};

type UseAiMindMapGenerationArgs = {
  currentDocument: MindMapDocument;
  isStartupScreenVisible: boolean;
  layoutType: MindMapLayoutType;
  replaceWithNewDocument: (document: MindMapDocument) => void;
};

export function useAiMindMapGeneration({
  currentDocument,
  isStartupScreenVisible,
  layoutType,
  replaceWithNewDocument,
}: UseAiMindMapGenerationArgs) {
  const aiGenerationEnabled = isTauri();
  const [dialogState, setDialogState] = useState<AiDialogState>(() =>
    createDialogState(loadAiConnectionSettings()),
  );

  const refreshConnectionSettings = useCallback(async () => {
    const savedSettings = loadAiConnectionSettings();

    setDialogState((current) => ({
      ...createDialogState(savedSettings),
      isOpen: current.isOpen,
      isPending: false,
      lastError: null,
    }));

    if (!aiGenerationEnabled || !savedSettings.remember) {
      return;
    }

    try {
      const savedApiKey = await getStoredAiApiKey();
      setDialogState((current) =>
        current.isOpen && current.apiKey.length === 0
          ? {
              ...current,
              apiKey: savedApiKey ?? "",
            }
          : current,
      );
    } catch (error) {
      setDialogState((current) =>
        current.isOpen
          ? {
              ...current,
              lastError: getSecretStoreErrorMessage(error),
            }
          : current,
      );
    }
  }, [aiGenerationEnabled]);

  const openDialog = useCallback(() => {
    if (!aiGenerationEnabled) {
      return;
    }

    setDialogState((current) => ({
      ...current,
      isOpen: true,
      isPending: false,
      lastError: null,
    }));

    void refreshConnectionSettings();
  }, [aiGenerationEnabled, refreshConnectionSettings]);

  const closeDialog = useCallback(() => {
    setDialogState((current) =>
      current.isPending
        ? current
        : {
            ...current,
            isOpen: false,
            isPending: false,
            lastError: null,
          },
    );
  }, []);

  const setEndpointUrl = useCallback((value: string) => {
    setDialogState((current) => ({
      ...current,
      endpointUrl: value,
    }));
  }, []);

  const setModel = useCallback((value: string) => {
    setDialogState((current) => ({
      ...current,
      model: value,
    }));
  }, []);

  const setApiKey = useCallback((value: string) => {
    setDialogState((current) => ({
      ...current,
      apiKey: value,
    }));
  }, []);

  const setRemember = useCallback((value: boolean) => {
    setDialogState((current) => ({
      ...current,
      remember: value,
    }));
  }, []);

  const setTopic = useCallback((value: string) => {
    setDialogState((current) => ({
      ...current,
      topic: value,
    }));
  }, []);

  const setSourceText = useCallback((value: string) => {
    setDialogState((current) => ({
      ...current,
      sourceText: value,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!aiGenerationEnabled) {
      return;
    }

    const topic = dialogState.topic.trim();
    if (!topic) {
      setDialogState((current) => ({
        ...current,
        lastError: "Enter a topic before generating a mind map.",
      }));
      return;
    }

    const apiKey = dialogState.apiKey.trim();
    if (!apiKey) {
      setDialogState((current) => ({
        ...current,
        lastError: "Enter an API key before generating a mind map.",
      }));
      return;
    }

    if (
      !isStartupScreenVisible &&
      mindMapHasMeaningfulContent(currentDocument) &&
      !window.confirm(
        "Replace the current mind map with a newly generated one? Unsaved changes in the current map will be lost.",
      )
    ) {
      return;
    }

    setDialogState((current) => ({
      ...current,
      isPending: true,
      lastError: null,
    }));

    try {
      const connection = normalizeAiConnection({
        endpointUrl: dialogState.endpointUrl,
        model: dialogState.model,
      });

      saveAiConnectionSettings({
        endpointUrl: connection.endpointUrl,
        model: connection.model,
        remember: dialogState.remember,
      });

      if (dialogState.remember) {
        await setStoredAiApiKey(apiKey);
      } else {
        await deleteStoredAiApiKey();
      }

      const outline = await generateMindMapOutline({
        connection: {
          ...connection,
          apiKey,
        },
        layoutType,
        locale: window.navigator.language || "en",
        sourceText: dialogState.sourceText.trim() || undefined,
        topic,
      });

      const nextDocument = buildAiMindMapDocument({
        layoutType,
        outline,
        topic,
      });

      replaceWithNewDocument(nextDocument);
      setDialogState((current) => ({
        ...createDialogState({
          endpointUrl: connection.endpointUrl,
          model: connection.model,
          remember: dialogState.remember,
        }),
        apiKey: dialogState.remember ? current.apiKey : "",
        isOpen: false,
      }));
    } catch (error) {
      setDialogState((current) => ({
        ...current,
        isPending: false,
        lastError: getAiGenerationErrorMessage(error),
      }));
      return;
    }

    setDialogState((current) => ({
      ...current,
      isPending: false,
    }));
  }, [
    aiGenerationEnabled,
    currentDocument,
    dialogState.apiKey,
    dialogState.endpointUrl,
    dialogState.model,
    dialogState.remember,
    dialogState.sourceText,
    dialogState.topic,
    isStartupScreenVisible,
    layoutType,
    replaceWithNewDocument,
  ]);

  return useMemo(
    () => ({
      aiGenerationEnabled,
      apiKey: dialogState.apiKey,
      endpointUrl: dialogState.endpointUrl,
      closeDialog,
      isOpen: dialogState.isOpen,
      isPending: dialogState.isPending,
      lastError: dialogState.lastError,
      model: dialogState.model,
      openDialog,
      remember: dialogState.remember,
      setApiKey,
      setEndpointUrl,
      setModel,
      setRemember,
      setSourceText,
      setTopic,
      sourceText: dialogState.sourceText,
      submit: handleSubmit,
      topic: dialogState.topic,
    }),
    [
      aiGenerationEnabled,
      closeDialog,
      dialogState.apiKey,
      dialogState.endpointUrl,
      dialogState.isOpen,
      dialogState.isPending,
      dialogState.lastError,
      dialogState.model,
      dialogState.remember,
      dialogState.sourceText,
      dialogState.topic,
      handleSubmit,
      openDialog,
      setApiKey,
      setEndpointUrl,
      setModel,
      setRemember,
      setSourceText,
      setTopic,
    ],
  );
}

function createDialogState(savedSettings: {
  endpointUrl: string;
  model: string;
  remember: boolean;
}): AiDialogState {
  return {
    apiKey: "",
    endpointUrl: savedSettings.endpointUrl,
    isOpen: false,
    isPending: false,
    lastError: null,
    model: savedSettings.model,
    remember: savedSettings.remember,
    sourceText: "",
    topic: "",
  };
}

function mindMapHasMeaningfulContent(document: MindMapDocument): boolean {
  const rootNode = document.nodes[document.rootId];

  if (!rootNode) {
    return false;
  }

  return (
    Object.keys(document.nodes).length > 1 ||
    rootNode.title.trim() !== "Central Topic" ||
    rootNode.notes.trim().length > 0
  );
}

function getAiGenerationErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to generate a mind map right now.";
}

function getSecretStoreErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unable to read the saved API key from the desktop keychain.";
}
