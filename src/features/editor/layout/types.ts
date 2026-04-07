import type { MindMapLayoutType } from "../../../domain/mindmap/model";
import type { Position } from "../types";

export type AutoLayoutResult = {
  positions: Record<string, Position>;
  topContour: Array<number | undefined>;
  bottomContour: Array<number | undefined>;
};

export type TreeLayoutConfig = {
  horizontalGap: number;
  verticalGap: number;
  layoutType: MindMapLayoutType;
};
