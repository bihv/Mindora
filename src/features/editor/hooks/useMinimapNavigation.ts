import {
  useCallback,
  useRef,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
} from "react";
import { clamp } from "../../../shared/math";
import { MINIMAP_HEIGHT, MINIMAP_WIDTH } from "../constants";
import type { CameraState, MinimapData } from "../types";

type UseMinimapNavigationArgs = {
  canvasHeight: number;
  canvasWidth: number;
  closeNodeMenu: () => void;
  minimap: MinimapData;
  setCamera: Dispatch<SetStateAction<CameraState>>;
};

export function useMinimapNavigation({
  canvasHeight,
  canvasWidth,
  closeNodeMenu,
  minimap,
  setCamera,
}: UseMinimapNavigationArgs) {
  const minimapRef = useRef<SVGSVGElement | null>(null);

  const updateCameraFromMinimapPoint = useCallback(
    (clientX: number, clientY: number) => {
      const minimapElement = minimapRef.current;
      if (!minimapElement || minimap.scale <= 0) {
        return;
      }

      const rect = minimapElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      const localX = clamp(
        ((clientX - rect.left) / rect.width) * MINIMAP_WIDTH,
        0,
        MINIMAP_WIDTH,
      );
      const localY = clamp(
        ((clientY - rect.top) / rect.height) * MINIMAP_HEIGHT,
        0,
        MINIMAP_HEIGHT,
      );
      const minimapX = clamp(
        localX,
        minimap.offsetX,
        minimap.offsetX + minimap.contentWidth,
      );
      const minimapY = clamp(
        localY,
        minimap.offsetY,
        minimap.offsetY + minimap.contentHeight,
      );

      setCamera((current) => ({
        ...current,
        x:
          minimap.bounds.minX +
          (minimapX - minimap.offsetX) / minimap.scale -
          canvasWidth / (2 * current.scale),
        y:
          minimap.bounds.minY +
          (minimapY - minimap.offsetY) / minimap.scale -
          canvasHeight / (2 * current.scale),
      }));
    },
    [canvasHeight, canvasWidth, minimap, setCamera],
  );

  const handleMinimapPointerDown = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      event.preventDefault();
      event.stopPropagation();
      closeNodeMenu();
      updateCameraFromMinimapPoint(event.clientX, event.clientY);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        updateCameraFromMinimapPoint(moveEvent.clientX, moveEvent.clientY);
      };

      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [closeNodeMenu, updateCameraFromMinimapPoint],
  );

  return {
    handleMinimapPointerDown,
    minimapRef,
  };
}
