import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBlankMindMap } from "../../../domain/mindmap/documents";
import { setMindMapNodeKind } from "../../../domain/mindmap/nodeContent";
import { InspectorDrawer } from "./InspectorDrawer";

vi.mock("emoji-picker-react", () => ({
  EmojiStyle: { NATIVE: "native" },
  Theme: { DARK: "dark" },
  default: ({
    onEmojiClick,
  }: {
    onEmojiClick: (value: { emoji: string }) => void;
  }) => (
    <button onClick={() => onEmojiClick({ emoji: "🎯" })} type="button">
      Emoji mock
    </button>
  ),
}));

class FileReaderMock {
  public result: string | ArrayBuffer | null = null;

  public error: DOMException | null = null;

  private readonly listeners = new Map<string, Array<() => void>>();

  addEventListener(event: string, callback: () => void): void {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), callback]);
  }

  readAsDataURL(file: File): void {
    this.result = `data:${file.type};base64,TEST`;
    queueMicrotask(() => {
      this.listeners.get("load")?.forEach((listener) => listener());
    });
  }
}

Object.defineProperty(window, "FileReader", {
  configurable: true,
  value: FileReaderMock,
});

function createSelectedNode(kind: "image" | "link" | "emoji") {
  const document = createBlankMindMap("Inspector");
  const root = document.nodes[document.rootId];

  if (kind === "link") {
    return {
      ...setMindMapNodeKind(root, "link"),
      data: { url: "https://example.com" },
    };
  }

  if (kind === "emoji") {
    return {
      ...setMindMapNodeKind(root, "emoji"),
      data: { emoji: "🙂" },
    };
  }

  return {
    ...setMindMapNodeKind(root, "image"),
    data: { imageUrl: "" },
  };
}

describe("InspectorDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles link, emoji, color, and image-import flows after section split", async () => {
    const onNodeColorChange = vi.fn();
    const onNodeEmojiChange = vi.fn();
    const onNodeImageUrlChange = vi.fn();
    const onNodeKindChange = vi.fn();
    const onNodeLinkUrlChange = vi.fn();
    const onNodeNotesChange = vi.fn();
    const onNodeTitleChange = vi.fn();

    const { rerender } = render(
      <InspectorDrawer
        isOpen={true}
        onNodeColorChange={onNodeColorChange}
        onNodeEmojiChange={onNodeEmojiChange}
        onNodeImageUrlChange={onNodeImageUrlChange}
        onNodeKindChange={onNodeKindChange}
        onNodeLinkUrlChange={onNodeLinkUrlChange}
        onNodeNotesChange={onNodeNotesChange}
        onNodeTitleChange={onNodeTitleChange}
        selectedNode={createSelectedNode("image")}
      />,
    );

    const file = new File(["img"], "demo.png", { type: "image/png" });
    fireEvent.change(screen.getByPlaceholderText(/https:\/\/example.com\/image\.png/i), {
      currentTarget: { value: "https://cdn.test/image.png" },
      target: { value: "https://cdn.test/image.png" },
    });
    fireEvent.drop(
      screen.getByRole("button", {
        name: /paste, drop, or choose a local image/i,
      }),
      {
      dataTransfer: {
        files: [file],
        items: [{ getAsFile: () => file, kind: "file" }],
      },
    },
    );

    await waitFor(() => {
      expect(onNodeImageUrlChange).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: /slate/i }));
    expect(onNodeColorChange).toHaveBeenCalled();

    rerender(
      <InspectorDrawer
        isOpen={true}
        onNodeColorChange={onNodeColorChange}
        onNodeEmojiChange={onNodeEmojiChange}
        onNodeImageUrlChange={onNodeImageUrlChange}
        onNodeKindChange={onNodeKindChange}
        onNodeLinkUrlChange={onNodeLinkUrlChange}
        onNodeNotesChange={onNodeNotesChange}
        onNodeTitleChange={onNodeTitleChange}
        selectedNode={createSelectedNode("link")}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/https:\/\/example.com/i), {
      currentTarget: { value: "https://openai.com" },
      target: { value: "https://openai.com" },
    });
    expect(onNodeLinkUrlChange).toHaveBeenCalled();

    rerender(
      <InspectorDrawer
        isOpen={true}
        onNodeColorChange={onNodeColorChange}
        onNodeEmojiChange={onNodeEmojiChange}
        onNodeImageUrlChange={onNodeImageUrlChange}
        onNodeKindChange={onNodeKindChange}
        onNodeLinkUrlChange={onNodeLinkUrlChange}
        onNodeNotesChange={onNodeNotesChange}
        onNodeTitleChange={onNodeTitleChange}
        selectedNode={createSelectedNode("emoji")}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: /emoji mock/i }));
    expect(onNodeEmojiChange).toHaveBeenCalledWith("🎯");
  });
});
