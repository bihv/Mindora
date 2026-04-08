import type {
  AiGeneratedOutlineNode,
  AiGenerationInput,
  NormalizedAiConnection,
} from "./types";

const REQUEST_TIMEOUT_MS = 45_000;
const AI_LOG_PREFIX = "[Mindora AI]";

export function normalizeAiConnection(params: {
  endpointUrl: string;
  model: string;
}): NormalizedAiConnection {
  const model = params.model.trim();
  if (!model) {
    throw new Error("Enter a model name.");
  }

  const rawEndpointUrl = params.endpointUrl.trim();
  if (!rawEndpointUrl) {
    throw new Error("Enter an endpoint URL.");
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawEndpointUrl);
  } catch {
    throw new Error("Enter a valid endpoint URL including http:// or https://.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Endpoint URLs must use http:// or https://.");
  }

  const trimmedPath = parsedUrl.pathname.replace(/\/+$/, "");
  let endpointPath: string | null = null;
  let requestFormat: NormalizedAiConnection["requestFormat"] | null = null;

  if (trimmedPath.endsWith("/chat/completions")) {
    endpointPath = trimmedPath;
    requestFormat = "chat_completions";
  } else if (trimmedPath.endsWith("/responses")) {
    endpointPath = trimmedPath;
    requestFormat = "responses";
  } else if (trimmedPath.endsWith("/v1")) {
    endpointPath = `${trimmedPath}/responses`;
    requestFormat = "responses";
  }

  if (!endpointPath || !requestFormat) {
    throw new Error(
      "Endpoint must be a full /responses or /chat/completions URL, or a base /v1 URL.",
    );
  }

  parsedUrl.pathname = endpointPath;
  parsedUrl.hash = "";

  return {
    endpointUrl: parsedUrl.toString(),
    model,
    requestFormat,
  };
}

export async function generateMindMapOutline(
  input: AiGenerationInput,
): Promise<AiGeneratedOutlineNode> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const requestId = createAiRequestId();
  const requestStartedAt = Date.now();

  try {
    const requestBody = buildRequestBody(input);
    const requestBodyJson = JSON.stringify(requestBody);

    logAiDebug("request:start", {
      endpointUrl: input.connection.endpointUrl,
      headers: {
        Authorization: maskBearerToken(input.connection.apiKey),
        "Content-Type": "application/json",
      },
      model: input.connection.model,
      requestBodyPreview: summarizeRequestBody(
        requestBody,
        input.connection.requestFormat,
      ),
      requestFormat: input.connection.requestFormat,
      requestId,
      sourceTextLength: input.sourceText?.length ?? 0,
      topic: input.topic,
    });

    const response = await fetch(input.connection.endpointUrl, {
      body: requestBodyJson,
      headers: {
        Authorization: `Bearer ${input.connection.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });

    const responseText = await response.text();
    const durationMs = Date.now() - requestStartedAt;

    logAiDebug("request:response", {
      contentType: response.headers.get("content-type"),
      durationMs,
      ok: response.ok,
      requestId,
      responseStatus: response.status,
      responseTextPreview: previewText(responseText, 1200),
    });

    const payload = parseJsonPayload(responseText);

    if (!response.ok) {
      throw new Error(getApiErrorMessage(response.status, payload, responseText));
    }

    if (
      isRecord(payload) &&
      isRecord(payload.error) &&
      typeof payload.error.message === "string"
    ) {
      throw new Error(payload.error.message.trim());
    }

    const structuredPayload = extractStructuredPayload(
      payload,
      input.connection.requestFormat,
    );
    logAiDebug("request:structured-payload", {
      payloadPreview: previewJson(structuredPayload),
      requestId,
    });

    return parseAiGeneratedOutline(structuredPayload);
  } catch (error) {
    if (isAbortError(error)) {
      logAiError("request:timeout", {
        durationMs: Date.now() - requestStartedAt,
        endpointUrl: input.connection.endpointUrl,
        requestId,
      });
      throw new Error("The AI request timed out. Please try again.");
    }

    if (error instanceof Error) {
      logAiError("request:error", {
        durationMs: Date.now() - requestStartedAt,
        endpointUrl: input.connection.endpointUrl,
        message: error.message,
        requestFormat: input.connection.requestFormat,
        requestId,
      });
      throw error;
    }

    logAiError("request:error", {
      durationMs: Date.now() - requestStartedAt,
      endpointUrl: input.connection.endpointUrl,
      error,
      requestFormat: input.connection.requestFormat,
      requestId,
    });
    throw new Error("Unable to generate a mind map right now.");
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function parseAiGeneratedOutline(value: unknown): AiGeneratedOutlineNode {
  const outline = parseOutlineNode(value, 0);
  if (!outline.children || outline.children.length === 0) {
    throw new Error("The AI response did not include any branches.");
  }

  return outline;
}

function parseOutlineNode(
  value: unknown,
  depth: number,
): AiGeneratedOutlineNode {
  if (!isRecord(value)) {
    throw new Error("The AI response did not match the expected outline format.");
  }

  const title = normalizeText(value.title);
  if (!title) {
    throw new Error("The AI response included a node without a title.");
  }

  const notes = normalizeOptionalText(value.notes);
  const rawChildren = value.children;

  if (rawChildren !== undefined && !Array.isArray(rawChildren)) {
    throw new Error("The AI response included an invalid children list.");
  }

  if (depth >= 2 && Array.isArray(rawChildren) && rawChildren.length > 0) {
    throw new Error("The AI response exceeded the supported branch depth.");
  }

  const children = Array.isArray(rawChildren)
    ? rawChildren
        .map((child) => parseOutlineNode(child, depth + 1))
        .filter((child) => child.title.length > 0)
    : [];

  return {
    ...(children.length > 0 ? { children } : {}),
    ...(notes ? { notes } : {}),
    title,
  };
}

function buildSystemInstructions(locale: string): string {
  return [
    "You generate compact mind map outlines for a desktop mind mapping app.",
    "Write in the same language as the user's topic and source material.",
    "Return concise, scannable branch titles that work well in a visual map.",
    "Add notes only when they add missing context. Keep them to one or two short sentences.",
    'Return only valid JSON. Do not include markdown, code fences, or commentary.',
    'Use this shape exactly: {"title":"string","notes":"string","children":[{"title":"string","notes":"string","children":[{"title":"string","notes":"string"}]}]}.',
    "Never exceed 8 first-level branches and 3 second-level branches per first-level branch.",
    'Use empty strings instead of null values. Omit extra keys.',
    `Prefer wording natural for locale ${locale || "unknown"}.`,
  ].join(" ");
}

function buildUserPrompt(input: AiGenerationInput): string {
  const sections = [
    `Topic:\n${input.topic.trim()}`,
    input.sourceText?.trim()
      ? `Source text:\n${input.sourceText.trim()}`
      : "Source text:\nNone provided. Brainstorm from the topic only.",
    `Requested layout type:\n${input.layoutType}`,
  ];

  return sections.join("\n\n");
}

function buildRequestBody(
  input: AiGenerationInput,
): Record<string, unknown> {
  const systemInstructions = buildSystemInstructions(input.locale);
  const userPrompt = buildUserPrompt(input);

  if (input.connection.requestFormat === "chat_completions") {
    return {
      messages: [
        {
          content: systemInstructions,
          role: "system",
        },
        {
          content: userPrompt,
          role: "user",
        },
      ],
      model: input.connection.model,
    };
  }

  return {
    input: userPrompt,
    instructions: systemInstructions,
    model: input.connection.model,
  };
}

function extractStructuredPayload(
  payload: unknown,
  requestFormat: NormalizedAiConnection["requestFormat"],
): unknown {
  if (requestFormat === "chat_completions") {
    return extractChatCompletionsPayload(payload);
  }

  return extractResponsesPayload(payload);
}

function extractResponsesPayload(payload: unknown): unknown {
  if (!isRecord(payload)) {
    throw new Error("The AI endpoint returned an unexpected response body.");
  }

  if (isRecord(payload.output_parsed)) {
    return payload.output_parsed;
  }

  if (typeof payload.output_text === "string") {
    return parseOutlinePayloadText(payload.output_text);
  }

  if (Array.isArray(payload.output)) {
    for (const item of payload.output) {
      if (!isRecord(item) || !Array.isArray(item.content)) {
        continue;
      }

      for (const contentItem of item.content) {
        const textValue = extractTextValue(contentItem);
        if (textValue) {
          return parseOutlinePayloadText(textValue);
        }
      }
    }
  }

  throw new Error("The AI endpoint returned no structured outline.");
}

function extractChatCompletionsPayload(payload: unknown): unknown {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) {
    throw new Error("The AI endpoint returned an unexpected chat completion body.");
  }

  const choices = payload.choices as unknown[];
  const firstChoice = choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    throw new Error("The AI endpoint returned no chat completion message.");
  }

  if (typeof firstChoice.message.refusal === "string") {
    throw new Error(firstChoice.message.refusal);
  }

  const { content } = firstChoice.message;

  if (typeof content === "string" && content.trim()) {
    return parseOutlinePayloadText(content);
  }

  if (Array.isArray(content)) {
    for (const item of content) {
      const textValue = extractTextValue(item);
      if (textValue) {
        return parseOutlinePayloadText(textValue);
      }
    }
  }

  throw new Error("The AI endpoint returned no structured outline.");
}

function extractTextValue(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.text === "string" && value.text.trim()) {
    return value.text;
  }

  if (typeof value.type === "string" && value.type === "text") {
    if (typeof value.content === "string" && value.content.trim()) {
      return value.content;
    }
  }

  return null;
}

function getApiErrorMessage(
  status: number,
  payload: unknown,
  responseText: string,
): string {
  if (
    isRecord(payload) &&
    isRecord(payload.error) &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message.trim();
  }

  if (isRecord(payload) && typeof payload.message === "string") {
    return payload.message.trim();
  }

  const trimmedResponseText = responseText.trim();
  if (trimmedResponseText) {
    return `AI request failed (${status}): ${trimmedResponseText}`;
  }

  return `AI request failed with status ${status}.`;
}

function parseJsonPayload(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("The AI endpoint returned invalid JSON.");
  }
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function createAiRequestId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function logAiDebug(event: string, details: Record<string, unknown>): void {
  console.info(AI_LOG_PREFIX, event, details);
}

function logAiError(event: string, details: Record<string, unknown>): void {
  console.error(AI_LOG_PREFIX, event, details);
}

function maskBearerToken(apiKey: string): string {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    return "Bearer [empty]";
  }

  const visiblePrefix = trimmedKey.slice(0, 6);
  const visibleSuffix = trimmedKey.slice(-4);
  return `Bearer ${visiblePrefix}...${visibleSuffix}`;
}

function summarizeRequestBody(
  requestBody: Record<string, unknown>,
  requestFormat: NormalizedAiConnection["requestFormat"],
): Record<string, unknown> {
  if (requestFormat === "chat_completions") {
    const messages = Array.isArray(requestBody.messages)
      ? requestBody.messages
      : [];

    return {
      model: requestBody.model,
      messages: messages.map((message, index) => {
        if (!isRecord(message)) {
          return {
            index,
            invalid: true,
          };
        }

        const content =
          typeof message.content === "string"
            ? message.content
            : JSON.stringify(message.content);

        return {
          contentLength: content?.length ?? 0,
          contentPreview: previewText(content ?? "", 280),
          index,
          role: message.role ?? null,
        };
      }),
    };
  }

  const inputText =
    typeof requestBody.input === "string" ? requestBody.input : "";

  return {
    inputLength: inputText.length,
    inputPreview: previewText(inputText, 420),
    instructionsLength:
      typeof requestBody.instructions === "string"
        ? requestBody.instructions.length
        : 0,
    instructionsPreview:
      typeof requestBody.instructions === "string"
        ? previewText(requestBody.instructions, 280)
        : null,
    model: requestBody.model,
  };
}

function previewText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function previewJson(value: unknown): string {
  try {
    return previewText(JSON.stringify(value), 1200);
  } catch {
    return "[unserializable payload]";
  }
}

function parseOutlinePayloadText(value: string): unknown {
  const normalizedValue = value.trim();
  const candidates = new Set<string>();

  if (normalizedValue) {
    candidates.add(normalizedValue);
  }

  const fencedMatch = normalizedValue.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fencedMatch?.[1]) {
    candidates.add(fencedMatch[1].trim());
  }

  const firstBraceIndex = normalizedValue.indexOf("{");
  const lastBraceIndex = normalizedValue.lastIndexOf("}");
  if (firstBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
    candidates.add(normalizedValue.slice(firstBraceIndex, lastBraceIndex + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  throw new Error("The AI endpoint returned invalid JSON.");
}
