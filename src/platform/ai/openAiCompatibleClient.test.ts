import { afterEach, describe, expect, it, vi } from "vitest";
import {
  generateMindMapOutline,
  normalizeAiConnection,
  parseAiGeneratedOutline,
} from "./openAiCompatibleClient";

describe("open ai compatible client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes a base /v1 URL to a responses endpoint", () => {
    expect(
      normalizeAiConnection({
        endpointUrl: "https://api.openai.com/v1/",
        model: "gpt-5-mini",
      }),
    ).toEqual({
      endpointUrl: "https://api.openai.com/v1/responses",
      model: "gpt-5-mini",
      requestFormat: "responses",
    });
  });

  it("keeps a full responses endpoint exactly as the request target", () => {
    expect(
      normalizeAiConnection({
        endpointUrl: "https://gateway.example.com/proxy/v1/responses?x=1",
        model: "demo",
      }),
    ).toEqual({
      endpointUrl: "https://gateway.example.com/proxy/v1/responses?x=1",
      model: "demo",
      requestFormat: "responses",
    });
  });

  it("keeps a full chat completions endpoint exactly as the request target", () => {
    expect(
      normalizeAiConnection({
        endpointUrl: "https://openrouter.ai/api/v1/chat/completions",
        model: "demo",
      }),
    ).toEqual({
      endpointUrl: "https://openrouter.ai/api/v1/chat/completions",
      model: "demo",
      requestFormat: "chat_completions",
    });
  });

  it("rejects invalid endpoints", () => {
    expect(() =>
      normalizeAiConnection({
        endpointUrl: "api.openai.com/v1",
        model: "gpt-5-mini",
      }),
    ).toThrow(/http:\/\/ or https:\/\//i);

    expect(() =>
      normalizeAiConnection({
        endpointUrl: "https://api.openai.com",
        model: "gpt-5-mini",
      }),
    ).toThrow(/full \/responses or \/chat\/completions URL/i);
  });

  it("posts a simple responses request and parses the outline", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            children: [
              {
                children: [
                  {
                    notes: "Start small.",
                    title: "Week 1",
                  },
                ],
                notes: "Core milestones.",
                title: "Plan",
              },
            ],
            notes: "High-level roadmap.",
            title: "Learning Rust",
          }),
        }),
        {
          status: 200,
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const outline = await generateMindMapOutline({
      connection: {
        apiKey: "sk-test",
        endpointUrl: "https://api.openai.com/v1/responses",
        model: "gpt-5-mini",
        requestFormat: "responses",
      },
      layoutType: "mindmap-card",
      locale: "en-US",
      sourceText: "Focus on milestones and practice.",
      topic: "Learning Rust",
    });

    expect(outline.title).toBe("Learning Rust");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [requestUrl, requestInit] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];

    expect(requestUrl).toBe("https://api.openai.com/v1/responses");
    expect(requestInit.headers).toEqual({
      Authorization: "Bearer sk-test",
      "Content-Type": "application/json",
    });

    const requestBody = JSON.parse(requestInit.body as string) as {
      instructions: string;
      input: string;
      model: string;
    };

    expect(requestBody.model).toBe("gpt-5-mini");
    expect(requestBody.input).toContain("Learning Rust");
    expect(requestBody.instructions).toContain("Return only valid JSON");
  });

  it("posts to the full chat completions endpoint and parses OpenAI-style chat output", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  children: [
                    {
                      children: [],
                      notes: "Task boards and planning.",
                      title: "Boards",
                    },
                  ],
                  notes: "",
                  title: "Trello features",
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const outline = await generateMindMapOutline({
      connection: {
        apiKey: "sk-test",
        endpointUrl: "https://openrouter.ai/api/v1/chat/completions",
        model: "google/gemma-3-27b-it:free",
        requestFormat: "chat_completions",
      },
      layoutType: "mindmap-card",
      locale: "vi-VN",
      topic: "cac tinh nang cua trello",
    });

    expect(outline.title).toBe("Trello features");

    const [requestUrl, requestInit] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    const requestBody = JSON.parse(requestInit.body as string) as {
      messages: Array<{ content: string; role: string }>;
    };

    expect(requestUrl).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(requestBody.messages).toHaveLength(2);
    expect(requestBody.messages[0]?.role).toBe("system");
    expect(requestBody.messages[0]?.content).toContain("Return only valid JSON");
  });

  it("parses chat completions content wrapped in markdown fences", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content:
                  "```json\n{\"title\":\"Trello features\",\"notes\":\"\",\"children\":[{\"title\":\"Boards\",\"notes\":\"\",\"children\":[]}]}\n```",
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const outline = await generateMindMapOutline({
      connection: {
        apiKey: "sk-test",
        endpointUrl: "https://openrouter.ai/api/v1/chat/completions",
        model: "google/gemma-3-27b-it:free",
        requestFormat: "chat_completions",
      },
      layoutType: "mindmap-card",
      locale: "vi-VN",
      topic: "cac tinh nang cua trello",
    });

    expect(outline.children?.[0]?.title).toBe("Boards");
  });

  it("rejects outlines that exceed the supported depth", () => {
    expect(() =>
      parseAiGeneratedOutline({
        children: [
          {
            children: [
              {
                children: [
                  {
                    notes: "",
                    title: "Too deep",
                  },
                ],
                notes: "",
                title: "Leaf",
              },
            ],
            notes: "",
            title: "Branch",
          },
        ],
        notes: "",
        title: "Root",
      }),
    ).toThrow(/supported branch depth/i);
  });
});
