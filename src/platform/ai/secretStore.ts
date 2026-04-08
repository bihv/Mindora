import { invoke, isTauri } from "@tauri-apps/api/core";

export async function getStoredAiApiKey(): Promise<string | null> {
  if (!isTauri()) {
    return null;
  }

  const result = await invoke<string | null>("get_ai_api_key");
  return typeof result === "string" && result.trim() ? result : null;
}

export async function setStoredAiApiKey(apiKey: string): Promise<void> {
  if (!isTauri()) {
    return;
  }

  await invoke("set_ai_api_key", {
    apiKey,
  });
}

export async function deleteStoredAiApiKey(): Promise<void> {
  if (!isTauri()) {
    return;
  }

  await invoke("delete_ai_api_key");
}
