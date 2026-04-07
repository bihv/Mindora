import { isTauri } from "@tauri-apps/api/core";
import type { RecentMindMapFile } from "./types";
import { getFileNameFromPath } from "./fileNames";

const RECENT_FILES_KEY = "mindora:recent-files";
const MAX_RECENT_FILES = 8;

export function loadRecentMindMapFiles(): RecentMindMapFile[] {
  if (!isTauri()) {
    return [];
  }

  const raw = localStorage.getItem(RECENT_FILES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isRecentMindMapFile).slice(0, MAX_RECENT_FILES);
  } catch {
    return [];
  }
}

export function rememberRecentMindMapFile(path: string): RecentMindMapFile[] {
  const nextRecentFiles = [
    {
      accessedAt: Date.now(),
      fileName: getFileNameFromPath(path),
      path,
    },
    ...loadRecentMindMapFiles().filter((recentFile) => recentFile.path !== path),
  ].slice(0, MAX_RECENT_FILES);

  localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(nextRecentFiles));

  return nextRecentFiles;
}

function isRecentMindMapFile(value: unknown): value is RecentMindMapFile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const recentFile = value as Partial<RecentMindMapFile>;

  return (
    typeof recentFile.accessedAt === "number" &&
    typeof recentFile.fileName === "string" &&
    typeof recentFile.path === "string"
  );
}
