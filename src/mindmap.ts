export type NodeColor = "slate" | "teal" | "amber" | "coral" | "violet";

export type MindMapNode = {
  id: string;
  title: string;
  notes: string;
  color: NodeColor;
  x: number;
  y: number;
  parentId: string | null;
  childrenIds: string[];
  collapsed: boolean;
};

export type MindMapDocument = {
  id: string;
  title: string;
  rootId: string;
  nodes: Record<string, MindMapNode>;
};

export type MindMapTemplate = {
  id: string;
  name: string;
  description: string;
  create: () => MindMapDocument;
};

export const STORAGE_KEY = "mindora:mvp-document";
export const TEMPLATE_KEY = "mindora:active-template";

export const NODE_COLORS: Record<
  NodeColor,
  { label: string; accent: string; surface: string; glow: string }
> = {
  slate: {
    label: "Slate",
    accent: "#8fa0c7",
    surface: "linear-gradient(135deg, rgba(73, 90, 129, 0.9), rgba(35, 45, 70, 0.95))",
    glow: "rgba(128, 148, 204, 0.38)",
  },
  teal: {
    label: "Teal",
    accent: "#61d8c4",
    surface: "linear-gradient(135deg, rgba(33, 119, 122, 0.95), rgba(13, 76, 84, 0.96))",
    glow: "rgba(72, 217, 198, 0.34)",
  },
  amber: {
    label: "Amber",
    accent: "#f7c86b",
    surface: "linear-gradient(135deg, rgba(150, 101, 22, 0.95), rgba(107, 62, 6, 0.96))",
    glow: "rgba(247, 198, 72, 0.3)",
  },
  coral: {
    label: "Coral",
    accent: "#ff9f8d",
    surface: "linear-gradient(135deg, rgba(160, 73, 70, 0.94), rgba(118, 42, 51, 0.96))",
    glow: "rgba(255, 133, 145, 0.32)",
  },
  violet: {
    label: "Violet",
    accent: "#b89cff",
    surface: "linear-gradient(135deg, rgba(96, 65, 171, 0.94), rgba(56, 37, 111, 0.98))",
    glow: "rgba(173, 146, 255, 0.34)",
  },
};

const ROOT_X = 1460;
const ROOT_Y = 860;
const HORIZONTAL_GAP = 300;
const VERTICAL_GAP = 170;

export function createMindMapNode(
  params: Partial<MindMapNode> &
    Pick<MindMapNode, "title" | "x" | "y" | "parentId" | "color">,
): MindMapNode {
  return {
    id: createId(),
    title: params.title,
    notes: params.notes ?? "",
    color: params.color,
    x: params.x,
    y: params.y,
    parentId: params.parentId,
    childrenIds: params.childrenIds ?? [],
    collapsed: params.collapsed ?? false,
  };
}

export function createBlankMindMap(title = "Focus Map"): MindMapDocument {
  const rootNode = createMindMapNode({
    title: "Central Topic",
    x: ROOT_X,
    y: ROOT_Y,
    parentId: null,
    color: "slate",
  });

  return {
    id: createId(),
    title,
    rootId: rootNode.id,
    nodes: {
      [rootNode.id]: rootNode,
    },
  };
}

export function cloneMindMapDocument(
  document: MindMapDocument,
): MindMapDocument {
  return {
    ...document,
    nodes: Object.fromEntries(
      Object.entries(document.nodes).map(([id, node]) => [
        id,
        {
          ...node,
          childrenIds: [...node.childrenIds],
        },
      ]),
    ),
  };
}

export function getBranchDirection(
  document: MindMapDocument,
  nodeId: string,
): -1 | 1 {
  const node = document.nodes[nodeId];

  if (!node || node.parentId === null) {
    return 1;
  }

  const parent = document.nodes[node.parentId];
  if (!parent) {
    return 1;
  }

  if (parent.parentId === null) {
    return node.x >= parent.x ? 1 : -1;
  }

  return getBranchDirection(document, parent.id);
}

export function getSubtreeIds(
  document: MindMapDocument,
  nodeId: string,
): string[] {
  const result: string[] = [];
  const stack = [nodeId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) {
      continue;
    }

    result.push(currentId);
    const currentNode = document.nodes[currentId];
    if (!currentNode) {
      continue;
    }

    for (let index = currentNode.childrenIds.length - 1; index >= 0; index -= 1) {
      stack.push(currentNode.childrenIds[index]);
    }
  }

  return result;
}

export function getVisibleNodeIds(document: MindMapDocument): string[] {
  const result: string[] = [];
  const stack = [document.rootId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) {
      continue;
    }

    result.push(currentId);
    const currentNode = document.nodes[currentId];
    if (!currentNode || currentNode.collapsed) {
      continue;
    }

    for (let index = currentNode.childrenIds.length - 1; index >= 0; index -= 1) {
      stack.push(currentNode.childrenIds[index]);
    }
  }

  return result;
}

export function createChildNode(
  document: MindMapDocument,
  parentId: string,
  title = "New Idea",
): { document: MindMapDocument; nodeId: string } {
  const parent = document.nodes[parentId];
  if (!parent) {
    return { document, nodeId: document.rootId };
  }

  const siblingCount = parent.childrenIds.length;
  const direction =
    parent.parentId === null
      ? (siblingCount % 2 === 0 ? 1 : -1)
      : getBranchDirection(document, parent.id);
  const positionIndex = parent.parentId === null
    ? Math.floor(siblingCount / 2)
    : siblingCount;
  const verticalOffset =
    parent.parentId === null
      ? (siblingCount % 2 === 0 ? -1 : 1) * positionIndex * VERTICAL_GAP
      : siblingCount * VERTICAL_GAP;

  const newNode = createMindMapNode({
    title,
    x: parent.x + direction * HORIZONTAL_GAP,
    y:
      parent.parentId === null
        ? parent.y + verticalOffset
        : parent.y + verticalOffset - ((Math.max(siblingCount - 1, 0) * VERTICAL_GAP) / 2),
    parentId: parent.id,
    color: parent.color,
  });

  document.nodes[parent.id] = {
    ...parent,
    childrenIds: [...parent.childrenIds, newNode.id],
    collapsed: false,
  };
  document.nodes[newNode.id] = newNode;

  return { document, nodeId: newNode.id };
}

export function createSiblingNode(
  document: MindMapDocument,
  nodeId: string,
): { document: MindMapDocument; nodeId: string } {
  const node = document.nodes[nodeId];
  if (!node || !node.parentId) {
    return createChildNode(document, document.rootId);
  }

  return createChildNode(document, node.parentId);
}

export function updateNodePosition(
  document: MindMapDocument,
  positions: Record<string, { x: number; y: number }>,
): MindMapDocument {
  for (const [nodeId, position] of Object.entries(positions)) {
    const node = document.nodes[nodeId];
    if (!node) {
      continue;
    }

    document.nodes[nodeId] = {
      ...node,
      x: position.x,
      y: position.y,
    };
  }

  return document;
}

export function deleteNode(
  document: MindMapDocument,
  nodeId: string,
): { document: MindMapDocument; selectedNodeId: string } {
  const node = document.nodes[nodeId];
  if (!node || node.parentId === null) {
    return { document, selectedNodeId: document.rootId };
  }

  const parent = document.nodes[node.parentId];
  if (parent) {
    document.nodes[parent.id] = {
      ...parent,
      childrenIds: parent.childrenIds.filter((childId) => childId !== nodeId),
    };
  }

  for (const currentId of getSubtreeIds(document, nodeId)) {
    delete document.nodes[currentId];
  }

  return {
    document,
    selectedNodeId: node.parentId,
  };
}

export function expandAllNodes(document: MindMapDocument): MindMapDocument {
  for (const nodeId of Object.keys(document.nodes)) {
    const node = document.nodes[nodeId];
    document.nodes[nodeId] = {
      ...node,
      collapsed: false,
    };
  }

  return document;
}

export function resolveSelectedNodeId(
  document: MindMapDocument,
  preferredNodeId: string | null | undefined,
): string {
  if (preferredNodeId && document.nodes[preferredNodeId]) {
    return preferredNodeId;
  }

  return document.rootId;
}

export function loadStoredMindMap(): MindMapDocument | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as MindMapDocument;
    if (
      parsed &&
      typeof parsed.rootId === "string" &&
      typeof parsed.title === "string" &&
      parsed.nodes &&
      typeof parsed.nodes === "object" &&
      parsed.nodes[parsed.rootId]
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function saveMindMap(document: MindMapDocument): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
}

export function loadStoredTemplateId(): string | null {
  return localStorage.getItem(TEMPLATE_KEY);
}

export function saveTemplateId(templateId: string): void {
  localStorage.setItem(TEMPLATE_KEY, templateId);
}

export const MIND_MAP_TEMPLATES: MindMapTemplate[] = [
  {
    id: "blank",
    name: "Blank Canvas",
    description: "Start from a single central topic and build your own branches.",
    create: () => createBlankMindMap("Focus Map"),
  },
  {
    id: "weekly-review",
    name: "Weekly Review",
    description: "Capture wins, blockers, priorities and follow-ups in one place.",
    create: () => {
      const document = createBlankMindMap("Weekly Review");
      const rootNode = document.nodes[document.rootId];
      rootNode.title = "Week 14 Review";

      const branches = [
        "Highlights",
        "Blockers",
        "Key Decisions",
        "Next Week",
      ];

      branches.forEach((branchTitle) => {
        const result = createChildNode(document, document.rootId, branchTitle);
        createChildNode(document, result.nodeId, "Detail");
      });

      return document;
    },
  },
  {
    id: "learning-plan",
    name: "Learning Plan",
    description: "Break a topic into concepts, practice, resources and checkpoints.",
    create: () => {
      const document = createBlankMindMap("Learning Sprint");
      const rootNode = document.nodes[document.rootId];
      rootNode.title = "New Skill";

      const concepts = createChildNode(document, document.rootId, "Core Concepts");
      createChildNode(document, concepts.nodeId, "Fundamentals");
      createChildNode(document, concepts.nodeId, "Mental Models");

      const practice = createChildNode(document, document.rootId, "Practice");
      createChildNode(document, practice.nodeId, "Exercises");
      createChildNode(document, practice.nodeId, "Mini Project");

      const resources = createChildNode(document, document.rootId, "Resources");
      createChildNode(document, resources.nodeId, "Articles");
      createChildNode(document, resources.nodeId, "Videos");

      const checkpoints = createChildNode(document, document.rootId, "Checkpoints");
      createChildNode(document, checkpoints.nodeId, "Week 1");
      createChildNode(document, checkpoints.nodeId, "Week 2");

      return document;
    },
  },
];

function createId(): string {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `node-${Math.random().toString(36).slice(2, 10)}`;
}
