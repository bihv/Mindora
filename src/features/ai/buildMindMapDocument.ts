import {
  createBlankMindMap,
  setMindMapLayoutType,
} from "../../domain/mindmap/documents";
import {
  createChildNode,
  updateNodePosition,
} from "../../domain/mindmap/nodeMutations";
import type {
  MindMapDocument,
  MindMapLayoutType,
  NodeColor,
} from "../../domain/mindmap/model";
import { buildLayoutPositions } from "../editor/layout";
import type { AiGeneratedOutlineNode } from "../../platform/ai/types";

const FIRST_LEVEL_COLORS: NodeColor[] = [
  "slate",
  "teal",
  "amber",
  "coral",
  "violet",
];

export function buildAiMindMapDocument(params: {
  layoutType: MindMapLayoutType;
  outline: AiGeneratedOutlineNode;
  topic: string;
}): MindMapDocument {
  const document = createBlankMindMap(params.topic.trim() || params.outline.title);
  const rootNode = document.nodes[document.rootId];
  const sanitizedOutline = sanitizeOutline(params.outline, 0);

  if (!sanitizedOutline.children || sanitizedOutline.children.length === 0) {
    throw new Error("The generated outline did not contain any branches.");
  }

  setMindMapLayoutType(document, params.layoutType);

  document.nodes[document.rootId] = {
    ...rootNode,
    notes: sanitizedOutline.notes ?? "",
    title: sanitizedOutline.title,
  };

  sanitizedOutline.children.slice(0, 8).forEach((branch, index) => {
    const color = FIRST_LEVEL_COLORS[index % FIRST_LEVEL_COLORS.length];
    const branchResult = createChildNode(document, document.rootId, branch.title);

    document.nodes[branchResult.nodeId] = {
      ...document.nodes[branchResult.nodeId],
      color,
      notes: branch.notes ?? "",
    };

    branch.children?.slice(0, 3).forEach((leaf) => {
      const leafResult = createChildNode(document, branchResult.nodeId, leaf.title);

      document.nodes[leafResult.nodeId] = {
        ...document.nodes[leafResult.nodeId],
        color,
        notes: leaf.notes ?? "",
      };
    });
  });

  updateNodePosition(document, buildLayoutPositions(document, params.layoutType));

  return document;
}

function sanitizeOutline(
  outline: AiGeneratedOutlineNode,
  depth: number,
): AiGeneratedOutlineNode {
  const title = outline.title.trim();
  if (!title) {
    throw new Error("The generated outline contained an empty node title.");
  }

  if (depth > 2) {
    throw new Error("The generated outline exceeded the supported depth.");
  }

  const notes = outline.notes?.trim() || undefined;
  const children = outline.children
    ?.map((child) => sanitizeOutline(child, depth + 1))
    .filter((child) => child.title.length > 0);

  return {
    ...(children && children.length > 0 ? { children } : {}),
    ...(notes ? { notes } : {}),
    title,
  };
}
