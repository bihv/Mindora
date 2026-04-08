import {
  DEFAULT_AI_ENDPOINT_URL,
  DEFAULT_AI_MODEL,
  type AiConnectionSettings,
} from "./types";

export const AI_SETTINGS_STORAGE_KEY = "mindora:ai-connection-settings";

type StoredAiConnectionSettings = Pick<
  AiConnectionSettings,
  "endpointUrl" | "model" | "remember"
>;

export function loadAiConnectionSettings(): StoredAiConnectionSettings {
  const fallback = createDefaultAiConnectionSettings();
  const raw = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isStoredAiConnectionSettings(parsed)) {
      return fallback;
    }

    const endpointUrl = getStoredEndpointUrl(parsed);

    return {
      endpointUrl: endpointUrl.trim() || fallback.endpointUrl,
      model: parsed.model.trim() || fallback.model,
      remember: parsed.remember,
    };
  } catch {
    return fallback;
  }
}

export function saveAiConnectionSettings(
  settings: StoredAiConnectionSettings,
): void {
  const normalized: StoredAiConnectionSettings = {
    endpointUrl: settings.endpointUrl.trim() || DEFAULT_AI_ENDPOINT_URL,
    model: settings.model.trim() || DEFAULT_AI_MODEL,
    remember: settings.remember,
  };

  localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
}

function createDefaultAiConnectionSettings(): StoredAiConnectionSettings {
  return {
    endpointUrl: DEFAULT_AI_ENDPOINT_URL,
    model: DEFAULT_AI_MODEL,
    remember: true,
  };
}

function isStoredAiConnectionSettings(
  value: unknown,
): value is StoredAiConnectionSettings {
  if (!value || typeof value !== "object") {
    return false;
  }

  const settings = value as Partial<StoredAiConnectionSettings>;
  const endpointUrl =
    typeof settings.endpointUrl === "string"
      ? settings.endpointUrl
      : typeof (value as { baseUrl?: unknown }).baseUrl === "string"
        ? String((value as { baseUrl?: unknown }).baseUrl)
        : null;

  return (
    typeof endpointUrl === "string" &&
    typeof settings.model === "string" &&
    typeof settings.remember === "boolean"
  );
}

function getStoredEndpointUrl(value: unknown): string {
  if (!value || typeof value !== "object") {
    return "";
  }

  const settings = value as {
    baseUrl?: unknown;
    endpointUrl?: unknown;
  };

  if (typeof settings.endpointUrl === "string") {
    return settings.endpointUrl;
  }

  if (typeof settings.baseUrl === "string") {
    return settings.baseUrl;
  }

  return "";
}
