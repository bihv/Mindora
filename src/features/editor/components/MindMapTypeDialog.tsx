import { useEffect, useId } from "react";
import {
  LOGIC_CHART_CARD_LAYOUT,
  LOGIC_CHART_LINE_LAYOUT,
  MINDMAP_CARD_LAYOUT,
  MINDMAP_LINE_LAYOUT,
  type MindMapLayoutType,
} from "../../../mindmap";
import mindMapPreviewAsset from "../../../assets/mindmap-type-classic.svg?raw";
import mindMapLinePreviewAsset from "../../../assets/mindmap-type-line.svg?raw";
import logicChartCardPreviewAsset from "../../../assets/mindmap-type-logic-chart-card.svg?raw";
import logicChartPreviewAsset from "../../../assets/mindmap-type-logic-chart.svg?raw";
import drawerStyles from "./EditorDrawer.module.css";
import styles from "./MindMapTypeDialog.module.css";

type PreviewTheme = "light" | "dark";

type MindMapTypeDialogProps = {
  currentLayoutType: MindMapLayoutType;
  initialLayoutType: MindMapLayoutType | null;
  isOpen: boolean;
  onReset: () => void;
  onSelect: (layoutType: MindMapLayoutType) => void;
  onClose: () => void;
  previewTheme?: PreviewTheme;
};

type MindMapTypeGroupId = "mindmap" | "logic-chart";

type MindMapTypeGroup = {
  id: MindMapTypeGroupId;
  title: string;
};

type MindMapTypeOption = {
  id: MindMapLayoutType;
  ariaLabel: string;
  groupId: MindMapTypeGroupId;
  label: string;
  description: string;
};

const MINDMAP_TYPE_GROUPS: MindMapTypeGroup[] = [
  {
    id: "mindmap",
    title: "Mind Map",
  },
  {
    id: "logic-chart",
    title: "Logic Chart",
  },
];

const MINDMAP_TYPE_OPTIONS: MindMapTypeOption[] = [
  {
    id: MINDMAP_CARD_LAYOUT,
    ariaLabel: "Mind Map card layout",
    groupId: "mindmap",
    label: "Balanced Cards",
    description: "Split ideas to both sides with rounded card nodes.",
  },
  {
    id: MINDMAP_LINE_LAYOUT,
    ariaLabel: "Mind Map line layout",
    groupId: "mindmap",
    label: "Balanced Lines",
    description: "Split ideas to both sides with a lighter line-first look.",
  },
  {
    id: LOGIC_CHART_CARD_LAYOUT,
    ariaLabel: "Logic Chart card layout",
    groupId: "logic-chart",
    label: "Hierarchical Cards",
    description: "Push the structure in one direction with clearer branches.",
  },
  {
    id: LOGIC_CHART_LINE_LAYOUT,
    ariaLabel: "Logic Chart line layout",
    groupId: "logic-chart",
    label: "Hierarchical Lines",
    description: "Keep a compact one-way flow with minimal line nodes.",
  },
];

const GROUPED_MINDMAP_TYPE_OPTIONS = MINDMAP_TYPE_GROUPS.map((group) => ({
  ...group,
  options: MINDMAP_TYPE_OPTIONS.filter((option) => option.groupId === group.id),
}));

function normalizePreviewSvgMarkup(markup: string) {
  const embeddedSvgMatch = markup.match(/href="data:image\/svg\+xml,([^"]+)"/);
  const unwrappedMarkup = embeddedSvgMatch
    ? decodeURIComponent(embeddedSvgMatch[1])
    : markup;

  return unwrappedMarkup
    .replace(
      /(<[^>]+data-view-id="preview-background"[^>]+fill=")rgba\(255,\s*255,\s*255,\s*1\)"/g,
      '$1var(--preview-svg-canvas)"',
    )
    .replace(/rgba\(255,\s*255,\s*255,\s*1\)/g, "var(--preview-svg-surface-stroke)")
    .replace(/rgba\(230,\s*230,\s*230,\s*1\)/g, "var(--preview-svg-node-fill)")
    .replace(/rgba\(38,\s*38,\s*38,\s*1\)/g, "var(--preview-svg-ink)")
    .replace(/rgba\(51,\s*51,\s*51,\s*1\)/g, "var(--preview-svg-muted-ink)")
    .replace(/rgb\(38,\s*38,\s*38\)/g, "var(--preview-svg-ink)")
    .replace(/rgb\(51,\s*51,\s*51\)/g, "var(--preview-svg-muted-ink)");
}

const MINDMAP_TYPE_PREVIEW_MARKUP: Record<MindMapLayoutType, string> = {
  [MINDMAP_CARD_LAYOUT]: normalizePreviewSvgMarkup(mindMapPreviewAsset),
  [MINDMAP_LINE_LAYOUT]: normalizePreviewSvgMarkup(mindMapLinePreviewAsset),
  [LOGIC_CHART_CARD_LAYOUT]: normalizePreviewSvgMarkup(
    logicChartCardPreviewAsset,
  ),
  [LOGIC_CHART_LINE_LAYOUT]: normalizePreviewSvgMarkup(logicChartPreviewAsset),
};

export function MindMapTypeDialog({
  currentLayoutType,
  initialLayoutType,
  isOpen,
  onReset,
  onSelect,
  onClose,
  previewTheme = "dark",
}: MindMapTypeDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const canReset =
    initialLayoutType !== null && initialLayoutType !== currentLayoutType;

  return (
    <aside
      aria-labelledby={titleId}
      className={[
        drawerStyles.canvasDrawer,
        drawerStyles.canvasDrawerRight,
        drawerStyles.isOpen,
      ].join(" ")}
      data-native-scroll="true"
      onWheel={(event) => event.stopPropagation()}
    >
      <section
        aria-labelledby={titleId}
        className={[drawerStyles.floatingPanel, styles.layoutPanel].join(" ")}
        role="region"
      >
        <header className={styles.layoutPanelHeader}>
          <div className={styles.header}>
            <span className={styles.eyebrow} id={titleId}>
              Layout Type
            </span>
          </div>

          <button
            aria-label="Close layout panel"
            className={styles.panelCloseButton}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className={styles.layoutPanelActions}>
          <button
            className={styles.secondaryButton}
            disabled={!canReset}
            onClick={onReset}
            type="button"
          >
            Reset
          </button>
        </div>

        <div className={styles.groupList}>
          {GROUPED_MINDMAP_TYPE_OPTIONS.map((group) => (
            <section className={styles.groupSection} key={group.id}>
              <div className={styles.groupHeader}>
                <span aria-hidden="true" className={styles.groupCaret} />
                <h3>{group.title}</h3>
              </div>

              <div className={[styles.groupGrid, styles.groupGridPanel].join(" ")}>
                {group.options.map((option) => {
                  const isSelected = currentLayoutType === option.id;

                  return (
                    <button
                      aria-label={option.ariaLabel}
                      aria-pressed={isSelected}
                      className={[
                        styles.optionCard,
                        styles.optionCardPanel,
                        option.groupId === "mindmap"
                          ? styles.optionCardMindMap
                          : styles.optionCardLogicChart,
                        isSelected ? styles.optionCardSelected : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={option.id}
                      onClick={() => onSelect(option.id)}
                      type="button"
                    >
                      <div
                        className={[
                          styles.previewFrame,
                          previewTheme === "dark"
                            ? styles.previewFrameDark
                            : styles.previewFrameLight,
                          option.groupId === "mindmap"
                            ? styles.previewFrameMindMap
                            : styles.previewFrameLogicChart,
                        ].join(" ")}
                      >
                        <MindMapTypeIllustration
                          layoutType={option.id}
                          theme={previewTheme}
                        />
                      </div>

                      <span className={styles.optionMeta}>
                        <strong>{option.label}</strong>
                        <span>{option.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </aside>
  );
}

function MindMapTypeIllustration({
  layoutType,
  theme,
}: {
  layoutType: MindMapLayoutType;
  theme: PreviewTheme;
}) {
  const markup = MINDMAP_TYPE_PREVIEW_MARKUP[layoutType];

  return (
    <span
      aria-hidden="true"
      className={[
        styles.previewSvg,
        theme === "dark" ? styles.previewSvgDark : styles.previewSvgLight,
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
