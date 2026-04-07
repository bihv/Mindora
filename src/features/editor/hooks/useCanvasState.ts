import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefCallback,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  CANVAS_SCALE_STEP,
  FIT_MAP_PADDING,
  MAX_CANVAS_SCALE,
  MIN_CANVAS_SCALE,
  NODE_WIDTH,
} from "../constants";
import type {
  CameraState,
  Position,
} from "../types";
import { clamp } from "../utils";
import {
  getMindMapLayoutType,
  getNodeHeightForLayout,
  type MindMapDocument,
} from "../../../mindmap";

type UseCanvasStateArgs = {
  rootId: string;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export function useCanvasState({ rootId }: UseCanvasStateArgs) {
  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0, scale: 1 });
  const [panning, setPanning] = useState<{
    pointerOrigin: Position;
    cameraOrigin: CameraState;
  } | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null);

  const hasCenteredRootRef = useRef(false);
  const latestDocumentRef = useRef<MindMapDocument | null>(null);
  const viewportRef = useCallback<RefCallback<HTMLDivElement>>((node) => {
    setViewportElement(node);
  }, []);

  const getViewportDimensions = useCallback(() => {
    return {
      width: Math.max(viewportElement?.clientWidth ?? viewportSize.width, 0),
      height: Math.max(viewportElement?.clientHeight ?? viewportSize.height, 0),
    };
  }, [viewportElement, viewportSize.height, viewportSize.width]);

  const centerOnNode = useCallback(
    (nodeId: string) => {
      const document = latestDocumentRef.current;
      const node = document?.nodes[nodeId];
      const { width, height } = getViewportDimensions();

      if (!node || width <= 0 || height <= 0) {
        return false;
      }

      const nodeHeight = getNodeHeightForLayout(
        getMindMapLayoutType(document),
        node,
      );

      setCamera((current) => ({
        ...current,
        x: node.x - width / (2 * current.scale) + NODE_WIDTH / 2,
        y: node.y - height / (2 * current.scale) + nodeHeight / 2,
      }));

      return true;
    },
    [getViewportDimensions],
  );

  const zoomTo = useCallback(
    (nextScale: number, anchor?: Position) => {
      const { width, height } = getViewportDimensions();
      if (width <= 0 || height <= 0) {
        return false;
      }

      const clampedScale = clamp(nextScale, MIN_CANVAS_SCALE, MAX_CANVAS_SCALE);

      setCamera((current) => {
        const anchorX = anchor?.x ?? width / 2;
        const anchorY = anchor?.y ?? height / 2;
        const worldX = current.x + anchorX / current.scale;
        const worldY = current.y + anchorY / current.scale;

        return {
          x: worldX - anchorX / clampedScale,
          y: worldY - anchorY / clampedScale,
          scale: clampedScale,
        };
      });

      return true;
    },
    [getViewportDimensions],
  );

  const zoomIn = useCallback(() => {
    return zoomTo(camera.scale + CANVAS_SCALE_STEP);
  }, [camera.scale, zoomTo]);

  const zoomOut = useCallback(() => {
    return zoomTo(camera.scale - CANVAS_SCALE_STEP);
  }, [camera.scale, zoomTo]);

  const fitToBounds = useCallback(
    (bounds: Bounds, padding = FIT_MAP_PADDING) => {
      const { width, height } = getViewportDimensions();
      if (
        width <= 0 ||
        height <= 0 ||
        !Number.isFinite(bounds.minX) ||
        !Number.isFinite(bounds.minY) ||
        !Number.isFinite(bounds.maxX) ||
        !Number.isFinite(bounds.maxY)
      ) {
        return false;
      }

      const contentWidth = Math.max(bounds.maxX - bounds.minX, 1);
      const contentHeight = Math.max(bounds.maxY - bounds.minY, 1);
      const availableWidth = Math.max(width - padding * 2, 1);
      const availableHeight = Math.max(height - padding * 2, 1);
      const nextScale = clamp(
        Math.min(availableWidth / contentWidth, availableHeight / contentHeight),
        MIN_CANVAS_SCALE,
        MAX_CANVAS_SCALE,
      );
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;

      setCamera({
        x: centerX - width / (2 * nextScale),
        y: centerY - height / (2 * nextScale),
        scale: nextScale,
      });

      return true;
    },
    [getViewportDimensions],
  );

  useEffect(() => {
    if (!viewportElement) {
      setViewportSize({ width: 0, height: 0 });
      return;
    }

    const updateViewportSize = () => {
      setViewportSize({
        width: viewportElement.clientWidth,
        height: viewportElement.clientHeight,
      });
    };

    updateViewportSize();

    const observer = new ResizeObserver(updateViewportSize);
    observer.observe(viewportElement);

    return () => {
      observer.disconnect();
    };
  }, [viewportElement]);

  useEffect(() => {
    if (hasCenteredRootRef.current || viewportSize.width === 0 || viewportSize.height === 0) {
      return;
    }

    let attempts = 0;
    let frameId = 0;

    const tryCenter = () => {
      attempts += 1;
      if (centerOnNode(rootId)) {
        hasCenteredRootRef.current = true;
        return;
      }

      if (attempts < 8) {
        frameId = requestAnimationFrame(tryCenter);
      }
    };

    frameId = requestAnimationFrame(tryCenter);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [centerOnNode, rootId, viewportSize.height, viewportSize.width]);

  useEffect(() => {
    if (!panning) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      setCamera({
        ...panning.cameraOrigin,
        x:
          panning.cameraOrigin.x -
          (event.clientX - panning.pointerOrigin.x) /
            panning.cameraOrigin.scale,
        y:
          panning.cameraOrigin.y -
          (event.clientY - panning.pointerOrigin.y) /
            panning.cameraOrigin.scale,
      });
    };

    const handlePointerUp = () => {
      setPanning(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [panning]);

  const startPanning = useCallback(
    (
      event: ReactPointerEvent<HTMLDivElement>,
      onBeforePan?: () => void,
    ) => {
      if (event.button !== 0) {
        return;
      }

      if (event.target !== event.currentTarget) {
        return;
      }

      event.preventDefault();
      onBeforePan?.();
      setPanning({
        pointerOrigin: { x: event.clientX, y: event.clientY },
        cameraOrigin: camera,
      });
    },
    [camera],
  );

  const handleViewportWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("[data-native-scroll='true']")
      ) {
        return;
      }

      event.preventDefault();
      if (event.ctrlKey) {
        const rect = viewportElement?.getBoundingClientRect();
        if (!rect) {
          return;
        }

        zoomTo(camera.scale * Math.exp(-event.deltaY * 0.0025), {
          x: clamp(event.clientX - rect.left, 0, rect.width),
          y: clamp(event.clientY - rect.top, 0, rect.height),
        });
        return;
      }

      setCamera((current) => ({
        ...current,
        x: current.x + event.deltaX / current.scale,
        y: current.y + event.deltaY / current.scale,
      }));
    },
    [camera.scale, viewportElement, zoomTo],
  );

  return {
    camera,
    centerOnNode,
    fitToBounds,
    handleViewportWheel,
    latestDocumentRef,
    panning,
    setCamera,
    startPanning,
    viewportRef,
    viewportSize,
    zoomIn,
    zoomOut,
    zoomTo,
  };
}
