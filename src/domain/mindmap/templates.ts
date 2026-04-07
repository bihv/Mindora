import { createBlankMindMap } from "./documents";
import { createChildNode } from "./nodeMutations";
import type { MindMapTemplate } from "./model";

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
    description:
      "Capture wins, blockers, priorities and follow-ups in one place.",
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
    description:
      "Break a topic into concepts, practice, resources and checkpoints.",
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

      const checkpoints = createChildNode(
        document,
        document.rootId,
        "Checkpoints",
      );
      createChildNode(document, checkpoints.nodeId, "Week 1");
      createChildNode(document, checkpoints.nodeId, "Week 2");

      return document;
    },
  },
];
