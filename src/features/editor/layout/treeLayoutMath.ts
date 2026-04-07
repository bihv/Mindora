import type { AutoLayoutResult } from "./types";

export function stackAutoLayoutSiblings(
  layouts: AutoLayoutResult[],
  depthOffset: number,
  verticalGap: number,
): number[] {
  if (layouts.length === 0) {
    return [];
  }

  const offsets: number[] = [];
  const stackedTop: Array<number | undefined> = [];
  const stackedBottom: Array<number | undefined> = [];

  layouts.forEach((layout, index) => {
    const offsetY =
      index === 0
        ? 0
        : calculateAutoLayoutOffset(
            stackedBottom,
            layout.topContour,
            depthOffset,
            verticalGap,
          );

    offsets.push(offsetY);
    mergeAutoLayoutContours(
      stackedTop,
      stackedBottom,
      layout.topContour,
      layout.bottomContour,
      offsetY,
      depthOffset,
    );
  });

  const shift =
    layouts.length === 1
      ? offsets[0] ?? 0
      : ((offsets[0] ?? 0) + (offsets[offsets.length - 1] ?? 0)) / 2;

  return offsets.map((offset) => offset - shift);
}

export function calculateAutoLayoutOffset(
  stackedBottom: Array<number | undefined>,
  nextTop: Array<number | undefined>,
  depthOffset: number,
  verticalGap: number,
): number {
  let requiredOffset = 0;

  nextTop.forEach((value, depth) => {
    if (value === undefined) {
      return;
    }

    const existingBottom = stackedBottom[depth + depthOffset];
    if (existingBottom === undefined) {
      return;
    }

    requiredOffset = Math.max(
      requiredOffset,
      existingBottom + verticalGap - value,
    );
  });

  return requiredOffset;
}

export function mergeAutoLayoutContours(
  targetTop: Array<number | undefined>,
  targetBottom: Array<number | undefined>,
  sourceTop: Array<number | undefined>,
  sourceBottom: Array<number | undefined>,
  offsetY: number,
  depthOffset: number,
): void {
  sourceTop.forEach((value, depth) => {
    if (value === undefined) {
      return;
    }

    const targetDepth = depth + depthOffset;
    const nextValue = value + offsetY;
    const currentTop = targetTop[targetDepth];

    targetTop[targetDepth] =
      currentTop === undefined ? nextValue : Math.min(currentTop, nextValue);
  });

  sourceBottom.forEach((value, depth) => {
    if (value === undefined) {
      return;
    }

    const targetDepth = depth + depthOffset;
    const nextValue = value + offsetY;
    const currentBottom = targetBottom[targetDepth];

    targetBottom[targetDepth] =
      currentBottom === undefined ? nextValue : Math.max(currentBottom, nextValue);
  });
}
