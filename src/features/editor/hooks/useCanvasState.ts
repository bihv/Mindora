import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  CANVAS_PADDING,
  NODE_HEIGHT,
  NODE_WIDTH,
} from "../constants";
import type {
  CameraState,
  Position,
} from "../types";
import type { MindMapDocument } from "../../../mindmap";

type UseCanvasStateArgs = {
  rootId: string;
};

export function useCanvasState({ rootId }: UseCanvasStateArgs) {
  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0 });
  const [panning, setPanning] = useState<{
    pointerOrigin: Position;
    cameraOrigin: CameraState;
  } | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const hasCenteredRootRef = useRef(false);
  const latestDocumentRef = useRef<MindMapDocument | null>(null);

  const centerOnNode = useCallback(
    (nodeId: string) => {
      const document = latestDocumentRef.current;
      const node = document?.nodes[nodeId];
      const viewport = viewportRef.current;
      const width = Math.max(
        (viewport?.clientWidth ?? viewportSize.width) - CANVAS_PADDING * 2,
        0,
      );
      const height = Math.max(
        (viewport?.clientHeight ?? viewportSize.height) - CANVAS_PADDING * 2,
        0,
      );

      if (!node || width <= 0 || height <= 0) {
        return false;
      }

      setCamera({
        x: node.x - width / 2 + NODE_WIDTH / 2,
        y: node.y - height / 2 + NODE_HEIGHT / 2,
      });

      return true;
    },
    [viewportSize.height, viewportSize.width],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const updateViewportSize = () => {
      setViewportSize({
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      });
    };

    updateViewportSize();

    const observer = new ResizeObserver(updateViewportSize);
    observer.observe(viewport);

    return () => {
      observer.disconnect();
    };
  }, []);

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
        x: panning.cameraOrigin.x - (event.clientX - panning.pointerOrigin.x),
        y: panning.cameraOrigin.y - (event.clientY - panning.pointerOrigin.y),
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
      event.preventDefault();
      setCamera((current) => ({
        x: current.x + event.deltaX,
        y: current.y + event.deltaY,
      }));
    },
    [],
  );

  return {
    camera,
    centerOnNode,
    handleViewportWheel,
    latestDocumentRef,
    panning,
    setCamera,
    startPanning,
    viewportRef,
    viewportSize,
  };
}
