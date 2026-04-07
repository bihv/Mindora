import type { MindMapDocument, MindMapNode } from "../../mindmap";
import type { MindMapFileHandle, RecentMindMapFile } from "./filePersistence";

export type Position = {
  x: number;
  y: number;
};

export type EditorState = {
  history: MindMapDocument[];
  historyIndex: number;
  selectedNodeId: string;
  hasActiveSelection: boolean;
  isNodeMenuOpen: boolean;
  searchQuery: string;
  activeTemplateId: string;
};

export type DraggingState = {
  nodeId: string;
  subtreeIds: string[];
  pointerOrigin: Position;
  originPositions: Record<string, Position>;
  delta: Position;
  viewportScale: number;
};

export type NodeReparentingState = {
  candidateParentId: string | null;
  nodeId: string;
  pointerPosition: Position;
  rootDirection: -1 | 1 | null;
};

export type CameraState = Position & {
  scale: number;
};

export type PanningState = {
  pointerOrigin: Position;
  cameraOrigin: CameraState;
};

export type SelectNodeOptions = {
  center?: boolean;
  openMenu?: boolean;
  showInspector?: boolean;
  closeOutline?: boolean;
};

export type NodeFocusState = "selected" | "lineage" | "descendant" | "dimmed";
export type ConnectorFocusState = Exclude<NodeFocusState, "selected">;

export type ConnectorItem = {
  id: string;
  color: string;
  focusState: ConnectorFocusState;
  path: string;
};

export type ConnectorPreviewItem = {
  color: string;
  isSnapped: boolean;
  path: string;
};

export type MinimapNodeItem = {
  id: string;
  color: string;
  focusState: NodeFocusState;
  isSelected: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MinimapData = {
  bounds: {
    minX: number;
    minY: number;
  };
  contentHeight: number;
  contentWidth: number;
  connectorPaths: Array<{
    id: string;
    focusState: ConnectorFocusState;
    path: string;
  }>;
  nodes: MinimapNodeItem[];
  offsetX: number;
  offsetY: number;
  scale: number;
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type SearchMatch = MindMapNode;

export type EditorFileState = {
  currentFileHandle: MindMapFileHandle | null;
  currentFileName: string | null;
  isPending: boolean;
  isStartupScreenVisible: boolean;
  lastError: string | null;
  lastSavedSnapshot: string | null;
  recentFiles: RecentMindMapFile[];
};
