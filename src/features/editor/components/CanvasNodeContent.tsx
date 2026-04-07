import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import {
  getMindMapNodeDetailText,
  getMindMapNodeDisplayTitle,
  getMindMapNodeEmoji,
  getMindMapNodeLineTitle,
  getMindMapNodeLinkUrl,
  getMindMapNodeMediaUrl,
  normalizeExternalUrl,
} from "../../../domain/mindmap/nodeContent";
import { MINDMAP_NODE_KIND_LABELS } from "../../../domain/mindmap/model";
import type { MindMapNode } from "../../../domain/mindmap/model";
import { joinClassNames } from "../../../shared/classNames";
import { openExternalUrl, truncateText } from "../utils";
import baseStyles from "./CanvasNodeBase.module.css";
import organicStyles from "./CanvasNodeOrganic.module.css";

type CanvasNodeContentProps = {
  isLineLayout: boolean;
  isMindMapLine: boolean;
  isMindMapLineLeft: boolean;
  isSelected: boolean;
  node: MindMapNode;
  onNodeImageView: (nodeId: string) => void;
};

export function CanvasNodeContent({
  isLineLayout,
  isMindMapLine,
  isMindMapLineLeft,
  isSelected,
  node,
  onNodeImageView,
}: CanvasNodeContentProps): ReactNode {
  const title = getMindMapNodeDisplayTitle(node);

  if (isLineLayout) {
    const isRoot = node.parentId === null;

    return (
      <div
        className={joinClassNames(
          baseStyles.mindNodeContent,
          organicStyles.mindNodeContentOrganic,
          isRoot && organicStyles.mindNodeContentOrganicRoot,
          isRoot && isSelected && organicStyles.mindNodeContentOrganicRootSelected,
          isMindMapLine && organicStyles.mindNodeContentClassicLine,
          isMindMapLine && isRoot && organicStyles.mindNodeContentClassicLineRoot,
        )}
      >
        <div
          className={joinClassNames(
            organicStyles.mindNodeOrganicTitleRow,
            isMindMapLineLeft && organicStyles.mindNodeOrganicTitleRowReverse,
            isMindMapLine &&
              isRoot &&
              organicStyles.mindNodeOrganicTitleRowCenter,
          )}
        >
          <h3
            className={joinClassNames(
              organicStyles.mindNodeTitleOrganic,
              isRoot && organicStyles.mindNodeTitleOrganicRoot,
              isSelected && organicStyles.mindNodeTitleSelected,
              isMindMapLineLeft && organicStyles.mindNodeTitleAlignEnd,
              isMindMapLine && isRoot && organicStyles.mindNodeTitleAlignCenter,
            )}
          >
            {getMindMapNodeLineTitle(node)}
          </h3>
        </div>
        {renderLineNodeDetail(node, {
          isMindMapLineLeft,
          isRoot,
          onNodeImageView,
        })}
      </div>
    );
  }

  if (node.kind === "text") {
    return (
      <div className={baseStyles.mindNodeContent}>
        <h3 className={joinClassNames(baseStyles.mindNodeTitle, baseStyles.mindNodeCompactTitle)}>
          {title}
        </h3>
        {node.notes ? (
          <p className={baseStyles.mindNodeNotes}>
            {truncateText(node.notes, 88)}
          </p>
        ) : null}
      </div>
    );
  }

  if (node.kind === "image") {
    const mediaUrl = getMindMapNodeMediaUrl(node);
    const detail = truncateText(getMindMapNodeDetailText(node), 78);

    return (
      <div className={baseStyles.mindNodeContent}>
        <div className={baseStyles.mindNodeRichRow}>
          {mediaUrl ? (
            <button
              aria-label={`View image for ${title}`}
              className={joinClassNames(
                baseStyles.mindNodeMediaPreview,
                baseStyles.mindNodeMediaPreviewButton,
              )}
              onClick={(event) => handleImageViewClick(event, node.id, onNodeImageView)}
              onPointerDown={(event) => event.stopPropagation()}
              type="button"
            >
              <img
                alt={title}
                className={baseStyles.mindNodeMediaImage}
                draggable={false}
                src={mediaUrl}
              />
            </button>
          ) : (
            <div className={baseStyles.mindNodeMediaPreview}>
              <span>{MINDMAP_NODE_KIND_LABELS.image}</span>
            </div>
          )}
          <div className={baseStyles.mindNodeRichMeta}>
            <h3 className={joinClassNames(baseStyles.mindNodeTitle, baseStyles.mindNodeCompactTitle)}>
              {title}
            </h3>
            {detail ? <p className={baseStyles.mindNodeDetail}>{detail}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  if (node.kind === "link") {
    const linkUrl = getMindMapNodeLinkUrl(node);
    const linkHref = normalizeExternalUrl(linkUrl);
    const detail = truncateText(getMindMapNodeDetailText(node), 78);

    return (
      <div className={baseStyles.mindNodeContent}>
        <div className={baseStyles.mindNodeRichMeta}>
          <h3 className={joinClassNames(baseStyles.mindNodeTitle, baseStyles.mindNodeCompactTitle)}>
            {title}
          </h3>
          <p className={baseStyles.mindNodeDetail}>{detail}</p>
          {linkHref ? (
            <a
              className={baseStyles.mindNodeLinkButton}
              href={linkHref}
              onClick={(event) => handleExternalLinkClick(event, linkHref)}
              onPointerDown={(event) => event.stopPropagation()}
              rel="noreferrer noopener"
              target="_blank"
            >
              Open link
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  const emoji = getMindMapNodeEmoji(node) || ":)";
  const emojiDetail = truncateText(getMindMapNodeDetailText(node), 78);

  return (
    <div className={baseStyles.mindNodeContent}>
      <div className={baseStyles.mindNodeRichRow}>
        <div className={baseStyles.mindNodeEmojiBadge}>{emoji}</div>
        <div className={baseStyles.mindNodeRichMeta}>
          <h3 className={joinClassNames(baseStyles.mindNodeTitle, baseStyles.mindNodeCompactTitle)}>
            {title}
          </h3>
          <p className={baseStyles.mindNodeDetail}>{emojiDetail}</p>
        </div>
      </div>
    </div>
  );
}

function renderLineNodeDetail(
  node: MindMapNode,
  options: {
    isMindMapLineLeft: boolean;
    isRoot: boolean;
    onNodeImageView: (nodeId: string) => void;
  },
): ReactNode {
  const isReverse = options.isMindMapLineLeft && node.parentId !== null;
  const detailText = truncateText(getMindMapNodeDetailText(node), 56);
  const rowClassName = joinClassNames(
    organicStyles.mindNodeOrganicMetaRow,
    isReverse && organicStyles.mindNodeOrganicMetaRowReverse,
    options.isRoot && organicStyles.mindNodeOrganicMetaRowCenter,
    options.isMindMapLineLeft &&
      !options.isRoot &&
      organicStyles.mindNodeOrganicMetaRowAlignEnd,
  );
  const detailClassName = joinClassNames(
    organicStyles.mindNodeOrganicDetail,
    isReverse && organicStyles.mindNodeOrganicDetailAlignEnd,
    options.isRoot && organicStyles.mindNodeOrganicDetailCenter,
  );

  if (node.kind === "text") {
    if (!detailText) {
      return null;
    }

    return <p className={detailClassName}>{detailText}</p>;
  }

  if (node.kind === "image") {
    const mediaUrl = getMindMapNodeMediaUrl(node);

    return (
      <div className={rowClassName}>
        {mediaUrl ? (
          <button
            aria-label={`View image for ${getMindMapNodeDisplayTitle(node)}`}
            className={joinClassNames(
              organicStyles.mindNodeOrganicMediaChip,
              baseStyles.mindNodeMediaPreviewButton,
            )}
            onClick={(event) =>
              handleImageViewClick(event, node.id, options.onNodeImageView)
            }
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
          >
            <img
              alt={getMindMapNodeDisplayTitle(node)}
              className={organicStyles.mindNodeOrganicMediaImage}
              draggable={false}
              src={mediaUrl}
            />
          </button>
        ) : (
          <div className={organicStyles.mindNodeOrganicMediaChip}>
            <span>IMG</span>
          </div>
        )}
        {detailText ? <p className={detailClassName}>{detailText}</p> : null}
      </div>
    );
  }

  if (node.kind === "link") {
    const linkHref = normalizeExternalUrl(getMindMapNodeLinkUrl(node));

    return (
      <div className={rowClassName}>
        {linkHref ? (
          <a
            className={joinClassNames(
              organicStyles.mindNodeOrganicKindTag,
              organicStyles.mindNodeOrganicKindAction,
            )}
            href={linkHref}
            onClick={(event) => handleExternalLinkClick(event, linkHref)}
            onPointerDown={(event) => event.stopPropagation()}
            rel="noreferrer noopener"
            target="_blank"
          >
            Open
          </a>
        ) : (
          <span className={organicStyles.mindNodeOrganicKindTag}>
            {MINDMAP_NODE_KIND_LABELS.link}
          </span>
        )}
        <p className={detailClassName}>{detailText}</p>
      </div>
    );
  }

  return (
    <div className={rowClassName}>
      <div className={organicStyles.mindNodeOrganicEmojiChip}>
        {getMindMapNodeEmoji(node) || ":)"}
      </div>
      <p className={detailClassName}>{detailText}</p>
    </div>
  );
}

function handleExternalLinkClick(
  event: ReactMouseEvent<HTMLAnchorElement>,
  url: string,
): void {
  event.preventDefault();
  event.stopPropagation();
  void openExternalUrl(url);
}

function handleImageViewClick(
  event: ReactMouseEvent<HTMLButtonElement>,
  nodeId: string,
  onNodeImageView: (nodeId: string) => void,
): void {
  event.preventDefault();
  event.stopPropagation();
  onNodeImageView(nodeId);
}
