import {
  MINDMAP_NODE_KIND_LABELS,
  isMindMapNodeKind,
  type MindMapNode,
  type MindMapNodeData,
  type MindMapNodeDataByKind,
  type MindMapNodeKind,
} from "./model";

export function createDefaultMindMapNodeData(
  kind: MindMapNodeKind,
): MindMapNodeData {
  switch (kind) {
    case "image":
      return { imageUrl: "" };
    case "link":
      return { url: "" };
    case "emoji":
      return { emoji: "" };
    case "text":
    default:
      return {};
  }
}

export function hydrateMindMapNode(node: MindMapNode): MindMapNode {
  const rawKind = node.kind as unknown;
  const kind = isMindMapNodeKind(rawKind) ? rawKind : "text";
  const rawData = (node as Partial<MindMapNode>).data;
  const data = normalizeMindMapNodeData(kind, rawData);

  if (rawKind === kind && isMindMapNodeDataEquivalent(kind, rawData, data)) {
    return node;
  }

  return {
    ...node,
    kind,
    data,
  };
}

export function setMindMapNodeKind(
  node: MindMapNode,
  kind: MindMapNodeKind,
): MindMapNode {
  if (node.kind === kind) {
    return node;
  }

  return {
    ...node,
    kind,
    data: convertMindMapNodeData(node, kind),
  };
}

export function getMindMapNodeMediaUrl(node: MindMapNode): string {
  return node.kind === "image"
    ? normalizeMindMapNodeData("image", node.data).imageUrl.trim()
    : "";
}

export function getMindMapNodeLinkUrl(node: MindMapNode): string {
  if (node.kind !== "link") {
    return "";
  }

  return normalizeMindMapNodeData("link", node.data).url.trim();
}

export function getMindMapNodeEmoji(node: MindMapNode): string {
  if (node.kind !== "emoji") {
    return "";
  }

  return normalizeMindMapNodeData("emoji", node.data).emoji.trim();
}

export function getMindMapNodeDisplayTitle(node: MindMapNode): string {
  const trimmedTitle = node.title.trim();
  if (trimmedTitle) {
    return trimmedTitle;
  }

  if (node.kind === "link") {
    return getMindMapNodeLinkUrl(node) || MINDMAP_NODE_KIND_LABELS.link;
  }

  if (node.kind === "emoji") {
    const emoji = getMindMapNodeEmoji(node);
    return emoji ? `Emoji ${emoji}` : MINDMAP_NODE_KIND_LABELS.emoji;
  }

  return MINDMAP_NODE_KIND_LABELS[node.kind];
}

export function getMindMapNodeDetailText(node: MindMapNode): string {
  if (node.kind === "text" || node.kind === "image") {
    return node.notes.trim();
  }

  if (node.kind === "link") {
    return (
      node.notes || getMindMapNodeLinkUrl(node) || "Add a destination URL"
    ).trim();
  }

  return (node.notes || "Emoji node").trim();
}

export function getMindMapNodeLineTitle(node: MindMapNode): string {
  return getMindMapNodeDisplayTitle(node);
}

export function getMindMapNodeSearchTexts(node: MindMapNode): string[] {
  const values = [
    node.title,
    node.notes,
    MINDMAP_NODE_KIND_LABELS[node.kind],
  ];

  const mediaUrl = getMindMapNodeMediaUrl(node);
  if (mediaUrl) {
    values.push(mediaUrl);
  }

  const linkUrl = getMindMapNodeLinkUrl(node);
  if (linkUrl) {
    values.push(linkUrl);
  }

  const emoji = getMindMapNodeEmoji(node);
  if (emoji) {
    values.push(emoji);
  }

  return values;
}

export function normalizeExternalUrl(value: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmedValue)) {
    return trimmedValue;
  }

  if (trimmedValue.startsWith("//")) {
    return `https:${trimmedValue}`;
  }

  return `https://${trimmedValue}`;
}

export function cloneMindMapNodeData(
  kind: MindMapNodeKind,
  data: MindMapNodeData,
): MindMapNodeData {
  switch (kind) {
    case "image":
      return { imageUrl: normalizeMindMapNodeData("image", data).imageUrl };
    case "link":
      return { url: normalizeMindMapNodeData("link", data).url };
    case "emoji":
      return { emoji: normalizeMindMapNodeData("emoji", data).emoji };
    case "text":
    default:
      return {};
  }
}

export function isMindMapNodeDataValue(
  kind: MindMapNodeKind,
  value: unknown,
): boolean {
  if (value === undefined) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  switch (kind) {
    case "image":
      return value.imageUrl === undefined || typeof value.imageUrl === "string";
    case "link":
      return value.url === undefined || typeof value.url === "string";
    case "emoji":
      return value.emoji === undefined || typeof value.emoji === "string";
    case "text":
    default:
      return true;
  }
}

export function normalizeMindMapNodeData(
  kind: "text",
  data: unknown,
): MindMapNodeDataByKind["text"];
export function normalizeMindMapNodeData(
  kind: "image",
  data: unknown,
): MindMapNodeDataByKind["image"];
export function normalizeMindMapNodeData(
  kind: "link",
  data: unknown,
): MindMapNodeDataByKind["link"];
export function normalizeMindMapNodeData(
  kind: "emoji",
  data: unknown,
): MindMapNodeDataByKind["emoji"];
export function normalizeMindMapNodeData(
  kind: MindMapNodeKind,
  data: unknown,
): MindMapNodeData;
export function normalizeMindMapNodeData(
  kind: MindMapNodeKind,
  data: unknown,
): MindMapNodeData {
  if (!isRecord(data)) {
    return createDefaultMindMapNodeData(kind);
  }

  switch (kind) {
    case "image":
      return {
        imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
      };
    case "link":
      return {
        url: typeof data.url === "string" ? data.url : "",
      };
    case "emoji":
      return {
        emoji: typeof data.emoji === "string" ? data.emoji : "",
      };
    case "text":
    default:
      return {};
  }
}

function convertMindMapNodeData(
  node: MindMapNode,
  kind: MindMapNodeKind,
): MindMapNodeData {
  if (kind === "image") {
    return {
      imageUrl:
        node.kind === "image"
          ? normalizeMindMapNodeData("image", node.data).imageUrl
          : "",
    };
  }

  if (kind === "link") {
    return node.kind === "link"
      ? { url: normalizeMindMapNodeData("link", node.data).url }
      : { url: "" };
  }

  if (kind === "emoji") {
    return node.kind === "emoji"
      ? { emoji: normalizeMindMapNodeData("emoji", node.data).emoji }
      : { emoji: "" };
  }

  return {};
}

function isMindMapNodeDataEquivalent(
  kind: MindMapNodeKind,
  value: unknown,
  normalizedValue: MindMapNodeData,
): boolean {
  if (!isRecord(value)) {
    return false;
  }

  switch (kind) {
    case "image":
      return (
        normalizeMindMapNodeData("image", value).imageUrl ===
        normalizeMindMapNodeData("image", normalizedValue).imageUrl
      );
    case "link":
      return value.url === normalizeMindMapNodeData("link", normalizedValue).url;
    case "emoji":
      return (
        value.emoji === normalizeMindMapNodeData("emoji", normalizedValue).emoji
      );
    case "text":
    default:
      return Object.keys(value).length === 0;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
