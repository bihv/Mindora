import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

const DEFAULT_WINDOW_TITLE = "mindora";

type UseWindowTitleArgs = {
  currentDocumentTitle: string | null;
  currentFileName: string | null;
  hasUnsavedFileChanges: boolean;
  isFileActionPending: boolean;
  lastFileActionError: string | null;
};

export function useWindowTitle({
  currentDocumentTitle,
  currentFileName,
  hasUnsavedFileChanges,
  isFileActionPending,
  lastFileActionError,
}: UseWindowTitleArgs) {
  useEffect(() => {
    const nextTitle = buildWindowTitle({
      currentDocumentTitle,
      currentFileName,
      hasUnsavedFileChanges,
      isFileActionPending,
      lastFileActionError,
    });

    void invoke("set_window_title", {
      title: nextTitle,
    });
  }, [
    currentDocumentTitle,
    currentFileName,
    hasUnsavedFileChanges,
    isFileActionPending,
    lastFileActionError,
  ]);
}

function buildWindowTitle({
  currentDocumentTitle,
  currentFileName,
  hasUnsavedFileChanges,
  isFileActionPending,
  lastFileActionError,
}: UseWindowTitleArgs): string {
  const titleParts: string[] = [];
  const primaryTitle = currentFileName ?? currentDocumentTitle;

  if (primaryTitle) {
    titleParts.push(primaryTitle);
  }

  if (isFileActionPending) {
    titleParts.push("Working...");
  } else if (lastFileActionError) {
    titleParts.push("Error");
  } else if (primaryTitle && hasUnsavedFileChanges) {
    titleParts.push("Modified");
  }

  if (titleParts.length === 0) {
    return DEFAULT_WINDOW_TITLE;
  }

  return titleParts.join(" • ");
}
