import type { MindMapLayoutType } from "../../domain/mindmap/model";

export const DEFAULT_AI_ENDPOINT_URL = "https://api.openai.com/v1/responses";
export const DEFAULT_AI_MODEL = "gpt-5-mini";

export type AiConnectionSettings = {
  apiKey?: string;
  endpointUrl: string;
  model: string;
  remember: boolean;
};

export type NormalizedAiConnection = {
  endpointUrl: string;
  model: string;
  requestFormat: "chat_completions" | "responses";
};

export type AiGenerationInput = {
  connection: NormalizedAiConnection & {
    apiKey: string;
  };
  layoutType: MindMapLayoutType;
  locale: string;
  sourceText?: string;
  topic: string;
};

export type AiGeneratedOutlineNode = {
  children?: AiGeneratedOutlineNode[];
  notes?: string;
  title: string;
};
