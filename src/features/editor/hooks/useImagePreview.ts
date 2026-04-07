import { useCallback, useMemo, useState } from "react";
import {
  getMindMapNodeDisplayTitle,
  getMindMapNodeMediaUrl,
} from "../../../domain/mindmap/nodeContent";
import type { MindMapDocument } from "../../../domain/mindmap/model";
import type { SelectNodeOptions } from "../types";

type UseImagePreviewArgs = {
  mindMap: MindMapDocument;
  selectNode: (nodeId: string, options?: SelectNodeOptions) => void;
};

export function useImagePreview({
  mindMap,
  selectNode,
}: UseImagePreviewArgs) {
  const [imagePreviewNodeId, setImagePreviewNodeId] = useState<string | null>(
    null,
  );

  const closeImagePreview = useCallback(() => {
    setImagePreviewNodeId(null);
  }, []);

  const handleNodeImageView = useCallback(
    (nodeId: string) => {
      const node = mindMap.nodes[nodeId];
      if (!node || node.kind !== "image" || !getMindMapNodeMediaUrl(node)) {
        return;
      }

      selectNode(nodeId, {
        openMenu: false,
        showInspector: true,
      });
      setImagePreviewNodeId(nodeId);
    },
    [mindMap.nodes, selectNode],
  );

  return useMemo(() => {
    const imagePreviewNode =
      imagePreviewNodeId === null ? null : mindMap.nodes[imagePreviewNodeId];
    const imagePreviewUrl =
      imagePreviewNode?.kind === "image"
        ? getMindMapNodeMediaUrl(imagePreviewNode)
        : "";
    const imagePreviewTitle = imagePreviewNode
      ? getMindMapNodeDisplayTitle(imagePreviewNode)
      : "Image preview";

    return {
      closeImagePreview,
      handleNodeImageView,
      imagePreviewSlides: imagePreviewUrl
        ? [
            {
              alt: imagePreviewTitle,
              src: imagePreviewUrl,
            },
          ]
        : [],
      imagePreviewUrl,
    };
  }, [closeImagePreview, handleNodeImageView, imagePreviewNodeId, mindMap.nodes]);
}
