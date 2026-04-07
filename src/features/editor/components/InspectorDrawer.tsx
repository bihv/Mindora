import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import type { EmojiClickData } from "emoji-picker-react";
import {
  MINDMAP_NODE_KINDS,
  MINDMAP_NODE_KIND_LABELS,
  NODE_COLORS,
  getMindMapNodeLinkUrl,
  getMindMapNodeMediaUrl,
  type MindMapNode,
  type MindMapNodeKind,
  type NodeColor,
} from "../../../mindmap";
import drawerStyles from "./EditorDrawer.module.css";
import styles from "./InspectorDrawer.module.css";

const IMAGE_FILE_ACCEPT = "image/*,.avif,.bmp,.gif,.jpeg,.jpg,.png,.svg,.webp";

const EmojiPickerPanel = lazy(async () => {
  const emojiPickerModule = await import("emoji-picker-react");
  const EmojiPicker = emojiPickerModule.default;

  return {
    default: function EmojiPickerPanel({
      onEmojiClick,
    }: {
      onEmojiClick: (emojiData: EmojiClickData) => void;
    }) {
      return (
        <EmojiPicker
          autoFocusSearch={false}
          emojiStyle={emojiPickerModule.EmojiStyle.NATIVE}
          height={380}
          lazyLoadEmojis
          onEmojiClick={onEmojiClick}
          previewConfig={{ showPreview: false }}
          searchPlaceholder="Search emoji"
          theme={emojiPickerModule.Theme.DARK}
          width="100%"
        />
      );
    },
  };
});

type InspectorDrawerProps = {
  isOpen: boolean;
  onNodeColorChange: (color: NodeColor) => void;
  onNodeEmojiChange: (value: string) => void;
  onNodeImageUrlChange: (value: string) => void;
  onNodeKindChange: (kind: MindMapNodeKind) => void;
  onNodeLinkUrlChange: (value: string) => void;
  onNodeNotesChange: (value: string) => void;
  onNodeTitleChange: (value: string) => void;
  selectedNode: MindMapNode;
};

function getFirstTransferFile(dataTransfer: DataTransfer | null): File | null {
  if (!dataTransfer) {
    return null;
  }

  const fileItem = Array.from(dataTransfer.items).find((item) => item.kind === "file");
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

export function InspectorDrawer({
  isOpen,
  onNodeColorChange,
  onNodeEmojiChange,
  onNodeImageUrlChange,
  onNodeKindChange,
  onNodeLinkUrlChange,
  onNodeNotesChange,
  onNodeTitleChange,
  selectedNode,
}: InspectorDrawerProps) {
  const [imageImportMessage, setImageImportMessage] = useState<string | null>(null);
  const [isImportingImage, setIsImportingImage] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setImageImportMessage(null);
    setIsImportingImage(false);
  }, [selectedNode.id, selectedNode.kind]);

  if (!isOpen) {
    return null;
  }

  const mediaUrl = getMindMapNodeMediaUrl(selectedNode);
  const linkUrl = getMindMapNodeLinkUrl(selectedNode);
  const hasEmbeddedImage = mediaUrl.startsWith("data:");
  const handleEmojiPickerSelect = (emojiData: EmojiClickData) => {
    onNodeEmojiChange(emojiData.emoji);
  };
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
      setImageImportMessage(`Embedded ${file.name}. This image now travels with the map.`);
    } catch {
      setImageImportMessage(`Couldn't read ${file.name}. Please try another image file.`);
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

  return (
    <aside
      className={[
        drawerStyles.canvasDrawer,
        drawerStyles.canvasDrawerRight,
        drawerStyles.isOpen,
      ].join(" ")}
      data-native-scroll="true"
      onWheel={(event) => event.stopPropagation()}
    >
      <div
        className={[
          drawerStyles.floatingPanel,
          drawerStyles.floatingPanelInspector,
        ].join(" ")}
      >
        <div className={styles.inspectorHeader}>
          <h2>Inspector</h2>
          <p>{selectedNode.parentId === null ? "Root node" : "Selected node"}</p>
        </div>

        <label className={styles.field}>
          <span>Node type</span>
          <select
            onChange={(event) =>
              onNodeKindChange(event.currentTarget.value as MindMapNodeKind)
            }
            value={selectedNode.kind}
          >
            {MINDMAP_NODE_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {MINDMAP_NODE_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
          <small className={styles.fieldHint}>
            Switch between text, image, link, and emoji nodes.
          </small>
        </label>

        <label className={styles.field}>
          <span>Title</span>
          <input
            onChange={(event) => onNodeTitleChange(event.currentTarget.value)}
            placeholder="Optional display title"
            value={selectedNode.title}
          />
        </label>

        {selectedNode.kind === "image" ? (
          <div className={styles.field}>
            <span>Image source</span>
            <input
              onChange={handleImageInputChange}
              onPaste={handleImagePaste}
              placeholder="https://example.com/image.png"
              value={hasEmbeddedImage ? "" : mediaUrl}
            />
            <small className={styles.fieldHint}>
              {hasEmbeddedImage
                ? "A local image is embedded in this node. Paste a URL to replace it, or clear it below."
                : "Paste a hosted image URL, or use the uploader below for a local image file."}
            </small>
            <input
              accept={IMAGE_FILE_ACCEPT}
              className={styles.visuallyHidden}
              onChange={handleImageFileInputChange}
              ref={imageFileInputRef}
              type="file"
            />
            <div className={styles.fieldActionRow}>
              <button
                className={styles.secondaryButton}
                disabled={isImportingImage}
                onClick={openImagePicker}
                type="button"
              >
                {isImportingImage ? "Embedding image..." : "Choose image"}
              </button>
              {mediaUrl ? (
                <button
                  className={styles.secondaryButton}
                  onClick={clearImageSource}
                  type="button"
                >
                  Clear image
                </button>
              ) : null}
            </div>
            <div
              className={[
                styles.imageUploadZone,
                isImportingImage ? styles.imageUploadZoneBusy : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={openImagePicker}
              onDragOver={handleImageDragOver}
              onDrop={handleImageDrop}
              onKeyDown={handleImageUploadKeyDown}
              onPaste={handleImagePaste}
              role="button"
              tabIndex={0}
            >
              <p className={styles.imageUploadTitle}>
                Paste, drop, or choose a local image
              </p>
              <p className={styles.imageUploadBody}>
                {imageImportMessage ??
                  "Supports PNG, JPG, GIF, WebP, SVG, AVIF, and BMP. Local images are embedded into the map so they keep rendering after save/export."}
              </p>
            </div>
          </div>
        ) : null}

        {selectedNode.kind === "link" ? (
          <label className={styles.field}>
            <span>Link URL</span>
            <input
              onChange={(event) => onNodeLinkUrlChange(event.currentTarget.value)}
              placeholder="https://example.com"
              value={linkUrl}
            />
            <small className={styles.fieldHint}>
              Clicking the node will open this address in a new tab.
            </small>
          </label>
        ) : null}

        {selectedNode.kind === "emoji" ? (
          <div className={styles.field}>
            <span>Emoji</span>
            <div className={styles.emojiPickerWidget}>
              <Suspense
                fallback={
                  <div
                    aria-live="polite"
                    className={styles.emojiPickerLoading}
                    role="status"
                  >
                    Loading emoji library...
                  </div>
                }
              >
                <EmojiPickerPanel onEmojiClick={handleEmojiPickerSelect} />
              </Suspense>
            </div>
          </div>
        ) : null}

        <label className={styles.field}>
          <span>Notes</span>
          <textarea
            onChange={(event) => onNodeNotesChange(event.currentTarget.value)}
            placeholder="Optional context"
            rows={5}
            value={selectedNode.notes}
          />
        </label>

        <div className={styles.field}>
          <span>Color</span>
          <div className={styles.colorGrid}>
            {(Object.entries(NODE_COLORS) as [
              NodeColor,
              (typeof NODE_COLORS)[NodeColor],
            ][]).map(([colorKey, colorValue]) => (
              <button
                aria-label={colorValue.label}
                className={[
                  styles.colorChip,
                  selectedNode.color === colorKey ? styles.colorChipActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={colorKey}
                onClick={() => onNodeColorChange(colorKey)}
                type="button"
              >
                <span
                  className={styles.colorChipSwatch}
                  style={{
                    background: colorValue.accent,
                    boxShadow: `0 0 0 6px ${colorValue.glow}`,
                  }}
                />
                <span>{colorValue.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={drawerStyles.panelDivider} />

        <p className={styles.shortcutHint}>
          Tab adds a child, Enter adds a sibling, Cmd/Ctrl+D duplicates, and
          Delete removes the node.
        </p>
      </div>
    </aside>
  );
}
