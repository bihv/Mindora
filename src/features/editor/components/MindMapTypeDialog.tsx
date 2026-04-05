import { useEffect, useId, useState } from "react";
import {
  LOGIC_CHART_LINE_LAYOUT,
  MINDMAP_CARD_LAYOUT,
  MINDMAP_LINE_LAYOUT,
  type MindMapLayoutType,
} from "../../../mindmap";
import mindMapPreviewAsset from "../../../assets/mindmap-type-classic.svg";
import mindMapLinePreviewAsset from "../../../assets/mindmap-type-line.svg";
import logicChartPreviewAsset from "../../../assets/mindmap-type-logic-chart.svg";
import styles from "./MindMapTypeDialog.module.css";

type MindMapTypeDialogProps = {
  currentLayoutType: MindMapLayoutType;
  isOpen: boolean;
  onApply: (layoutType: MindMapLayoutType) => void;
  onClose: () => void;
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
  },
  {
    id: MINDMAP_LINE_LAYOUT,
    ariaLabel: "Mind Map line layout",
    groupId: "mindmap",
  },
  {
    id: LOGIC_CHART_LINE_LAYOUT,
    ariaLabel: "Logic Chart line layout",
    groupId: "logic-chart",
  },
];

const GROUPED_MINDMAP_TYPE_OPTIONS = MINDMAP_TYPE_GROUPS.map((group) => ({
  ...group,
  options: MINDMAP_TYPE_OPTIONS.filter((option) => option.groupId === group.id),
}));

export function MindMapTypeDialog({
  currentLayoutType,
  isOpen,
  onApply,
  onClose,
}: MindMapTypeDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [selectedLayoutType, setSelectedLayoutType] = useState(currentLayoutType);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedLayoutType(currentLayoutType);
  }, [currentLayoutType, isOpen]);

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

  const handleApply = () => {
    if (selectedLayoutType !== currentLayoutType) {
      onApply(selectedLayoutType);
    }

    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Close layout dialog"
          className={styles.closeButton}
          onClick={onClose}
          type="button"
        >
          ×
        </button>

        <header className={styles.header}>
          <span className={styles.eyebrow}>Layout Gallery</span>
          <h2 id={titleId}>Choose a layout style</h2>
          <p id={descriptionId}>
            Pick the visual structure that matches how ideas should flow.
            Switching styles will re-layout the current map.
          </p>
        </header>

        <div className={styles.groupList}>
          {GROUPED_MINDMAP_TYPE_OPTIONS.map((group) => (
            <section className={styles.groupSection} key={group.id}>
              <div className={styles.groupHeader}>
                <span aria-hidden="true" className={styles.groupCaret} />
                <h3>{group.title}</h3>
              </div>

              <div className={styles.groupGrid}>
                {group.options.map((option) => {
                  const isSelected = selectedLayoutType === option.id;
                  const isCurrent = currentLayoutType === option.id;

                  return (
                    <button
                      aria-label={option.ariaLabel}
                      aria-pressed={isSelected}
                      className={[
                        styles.optionCard,
                        isSelected ? styles.optionCardSelected : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={option.id}
                      onClick={() => setSelectedLayoutType(option.id)}
                      type="button"
                    >
                      {isCurrent ? (
                        <span className={styles.currentBadge}>Current</span>
                      ) : null}

                      <div
                        className={[
                          styles.previewFrame,
                          option.groupId === "mindmap"
                            ? styles.previewFrameMindMap
                            : styles.previewFrameLogicChart,
                        ].join(" ")}
                      >
                        <MindMapTypeIllustration layoutType={option.id} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerText}>
            <strong>Tip:</strong> You can reopen this anytime from the desktop
            menu: Layout → Mindmap Type...
          </div>
          <div className={styles.actions}>
            <button
              className={styles.secondaryButton}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className={styles.primaryButton}
              onClick={handleApply}
              type="button"
            >
              {selectedLayoutType === currentLayoutType ? "Done" : "Apply layout"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function MindMapTypeIllustration({
  layoutType,
}: {
  layoutType: MindMapLayoutType;
}) {
  if (layoutType === MINDMAP_CARD_LAYOUT) {
    return (
      <img
        alt=""
        aria-hidden="true"
        className={[styles.previewSvg, styles.previewImage].join(" ")}
        draggable={false}
        src={mindMapPreviewAsset}
      />
    );
  }

  if (layoutType === MINDMAP_LINE_LAYOUT) {
    return (
      <img
        alt=""
        aria-hidden="true"
        className={[styles.previewSvg, styles.previewImage].join(" ")}
        draggable={false}
        src={mindMapLinePreviewAsset}
      />
    );
  }

  if (layoutType === LOGIC_CHART_LINE_LAYOUT) {
    return (
      <img
        alt=""
        aria-hidden="true"
        className={[styles.previewSvg, styles.previewImage].join(" ")}
        draggable={false}
        src={logicChartPreviewAsset}
      />
    );
  }

  return null;
}
