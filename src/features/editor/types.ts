import type { MindMapDocument, MindMapNode } from "../../mindmap";

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
};

export type CameraState = Position;

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
