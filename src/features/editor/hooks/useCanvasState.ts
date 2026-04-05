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
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null);

  const hasCenteredRootRef = useRef(false);
  const latestDocumentRef = useRef<MindMapDocument | null>(null);
  const viewportRef = useCallback<RefCallback<HTMLDivElement>>((node) => {
    setViewportElement(node);
  }, []);

  const centerOnNode = useCallback(
    (nodeId: string) => {
      const document = latestDocumentRef.current;
      const node = document?.nodes[nodeId];
      const width = Math.max(viewportElement?.clientWidth ?? viewportSize.width, 0);
      const height = Math.max(viewportElement?.clientHeight ?? viewportSize.height, 0);

      if (!node || width <= 0 || height <= 0) {
        return false;
      }

      setCamera({
        x: node.x - width / 2 + NODE_WIDTH / 2,
        y: node.y - height / 2 + NODE_HEIGHT / 2,
      });

      return true;
    },
    [viewportElement, viewportSize.height, viewportSize.width],
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
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("[data-native-scroll='true']")
      ) {
        return;
      }

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
