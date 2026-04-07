import styles from "../InspectorDrawer.module.css";
import {
  IMAGE_FILE_ACCEPT,
  useImageImport,
} from "./useImageImport";

type InspectorImageSectionProps = ReturnType<typeof useImageImport>;

export function InspectorImageSection({
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
}: InspectorImageSectionProps) {
  return (
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
  );
}
