import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import {
  getMindMapNodeMediaUrl,
} from "../../../../domain/mindmap/nodeContent";
import type { MindMapNode } from "../../../../domain/mindmap/model";

export const IMAGE_FILE_ACCEPT =
  "image/*,.avif,.bmp,.gif,.jpeg,.jpg,.png,.svg,.webp";

type UseImageImportArgs = {
  onNodeImageUrlChange: (value: string) => void;
  selectedNode: MindMapNode;
};

export function useImageImport({
  onNodeImageUrlChange,
  selectedNode,
}: UseImageImportArgs) {
  const [imageImportMessage, setImageImportMessage] = useState<string | null>(
    null,
  );
  const [isImportingImage, setIsImportingImage] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setImageImportMessage(null);
    setIsImportingImage(false);
  }, [selectedNode.id, selectedNode.kind]);

  const mediaUrl = getMindMapNodeMediaUrl(selectedNode);
  const hasEmbeddedImage = mediaUrl.startsWith("data:");

  const handleImageFileImport = async (file: File) => {
    if (!isSupportedImageFile(file)) {
      setImageImportMessage("Only image files can be attached to an image node.");
      return;
    }

    setIsImportingImage(true);
    setImageImportMessage(`Embedding ${file.name} into this map...`);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      onNodeImageUrlChange(dataUrl);
      setImageImportMessage(
        `Embedded ${file.name}. This image now travels with the map.`,
      );
    } catch {
      setImageImportMessage(
        `Couldn't read ${file.name}. Please try another image file.`,
      );
    } finally {
      setIsImportingImage(false);

      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = "";
      }
    }
  };

  const handleImageInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setImageImportMessage(null);
    onNodeImageUrlChange(event.currentTarget.value);
  };

  const handleImageFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }

    void handleImageFileImport(file);
  };

  const handleImagePaste = (
    event: ClipboardEvent<HTMLInputElement> | ClipboardEvent<HTMLDivElement>,
  ) => {
    const file = getFirstTransferFile(event.clipboardData);
    if (!file) {
      return;
    }

    event.preventDefault();
    void handleImageFileImport(file);
  };

  const handleImageDrop = (event: DragEvent<HTMLDivElement>) => {
    const file = getFirstTransferFile(event.dataTransfer);
    if (!file) {
      return;
    }

    event.preventDefault();
    void handleImageFileImport(file);
  };

  const handleImageDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (getFirstTransferFile(event.dataTransfer)) {
      event.preventDefault();
    }
  };

  const handleImageUploadKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    imageFileInputRef.current?.click();
  };

  const openImagePicker = () => {
    if (isImportingImage) {
      return;
    }

    imageFileInputRef.current?.click();
  };

  const clearImageSource = () => {
    setImageImportMessage(null);
    onNodeImageUrlChange("");
  };

  return {
    clearImageSource,
    handleImageDragOver,
    handleImageDrop,
    handleImageFileInputChange,
    handleImageInputChange,
    handleImagePaste,
    handleImageUploadKeyDown,
    hasEmbeddedImage,
    imageFileInputRef,
    imageImportMessage,
    isImportingImage,
    mediaUrl,
    openImagePicker,
  };
}

function getFirstTransferFile(dataTransfer: DataTransfer | null): File | null {
  if (!dataTransfer) {
    return null;
  }

  const fileItem = Array.from(dataTransfer.items).find(
    (item) => item.kind === "file",
  );
  const itemFile = fileItem?.getAsFile();

  if (itemFile) {
    return itemFile;
  }

  return dataTransfer.files[0] ?? null;
}

function isSupportedImageFile(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(file.name)
  );
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener(
      "load",
      () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("Unable to read the selected image."));
      },
      { once: true },
    );
    reader.addEventListener(
      "error",
      () => {
        reject(reader.error ?? new Error("Unable to read the selected image."));
      },
      { once: true },
    );

    reader.readAsDataURL(file);
  });
}
