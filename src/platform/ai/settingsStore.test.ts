import { beforeEach, describe, expect, it } from "vitest";
import {
  AI_SETTINGS_STORAGE_KEY,
  loadAiConnectionSettings,
  saveAiConnectionSettings,
} from "./settingsStore";

describe("ai settings store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns desktop AI defaults when no settings are stored", () => {
    expect(loadAiConnectionSettings()).toEqual({
      endpointUrl: "https://api.openai.com/v1/responses",
      model: "gpt-5-mini",
      remember: true,
    });
  });

  it("persists endpoint, model, and remember without storing an api key", () => {
    saveAiConnectionSettings({
      endpointUrl: "https://gateway.example.com/v1/chat/completions",
      model: "demo-model",
      remember: false,
    });

    expect(loadAiConnectionSettings()).toEqual({
      endpointUrl: "https://gateway.example.com/v1/chat/completions",
      model: "demo-model",
      remember: false,
    });
    expect(localStorage.getItem(AI_SETTINGS_STORAGE_KEY)).not.toContain("sk-");
  });

  it("migrates legacy stored baseUrl values", () => {
    localStorage.setItem(
      AI_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        baseUrl: "https://api.openai.com/v1",
        model: "legacy-model",
        remember: true,
      }),
    );

    expect(loadAiConnectionSettings()).toEqual({
      endpointUrl: "https://api.openai.com/v1",
      model: "legacy-model",
      remember: true,
    });
  });
});
