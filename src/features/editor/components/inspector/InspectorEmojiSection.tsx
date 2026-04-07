import { Suspense, lazy } from "react";
import type { EmojiClickData } from "emoji-picker-react";
import styles from "../InspectorDrawer.module.css";

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

type InspectorEmojiSectionProps = {
  onNodeEmojiChange: (value: string) => void;
};

export function InspectorEmojiSection({
  onNodeEmojiChange,
}: InspectorEmojiSectionProps) {
  const handleEmojiPickerSelect = (emojiData: EmojiClickData) => {
    onNodeEmojiChange(emojiData.emoji);
  };

  return (
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
  );
}
