import {
  BADGE_FONT,
  FONT_FAMILY,
} from "./config";

let measurementContext: CanvasRenderingContext2D | null = null;

export { BADGE_FONT, FONT_FAMILY };

export function buildTextBlockMarkup(params: {
  baselineY: number;
  color: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  lines: string[];
  opacity: number;
  x: number;
}): string {
  const {
    baselineY,
    color,
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    lines,
    opacity,
    x,
  } = params;

  if (lines.length === 0) {
    return "";
  }

  const tspans = lines
    .map(
      (line, index) => `
        <tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>
      `,
    )
    .join("");

  return `
    <text
      x="${x}"
      y="${baselineY}"
      fill="${color}"
      fill-opacity="${opacity}"
      font-family="${fontFamily}"
      font-size="${fontSize}"
      font-weight="${fontWeight}"
    >${tspans}
    </text>
  `;
}

export function wrapText(
  value: string,
  maxWidth: number,
  font: string,
  maxLines: number,
): string[] {
  const normalizedValue = value.replace(/\r/g, "");
  if (!normalizedValue.trim() || maxLines <= 0) {
    return [];
  }

  const lines: string[] = [];
  const paragraphs = normalizedValue.split("\n");
  let truncated = false;

  for (const paragraph of paragraphs) {
    if (lines.length >= maxLines) {
      truncated = true;
      break;
    }

    const normalizedParagraph = paragraph.trim().replace(/\s+/g, " ");
    if (!normalizedParagraph) {
      continue;
    }

    const paragraphLines = splitParagraphIntoLines(
      normalizedParagraph,
      maxWidth,
      font,
    );

    for (const line of paragraphLines) {
      if (lines.length >= maxLines) {
        truncated = true;
        break;
      }

      lines.push(line);
    }

    if (truncated) {
      break;
    }
  }

  if (lines.length === 0) {
    return [];
  }

  if (truncated) {
    lines[lines.length - 1] = ellipsizeText(lines[lines.length - 1], maxWidth, font);
  }

  return lines;
}

export function measureTextWidth(value: string, font: string): number {
  const context = getMeasurementContext();
  context.font = font;
  return context.measureText(value).width;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function splitParagraphIntoLines(
  paragraph: string,
  maxWidth: number,
  font: string,
): string[] {
  const words = paragraph.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (measureTextWidth(candidate, font) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = "";
    }

    if (measureTextWidth(word, font) <= maxWidth) {
      currentLine = word;
      continue;
    }

    const segments = splitLongWord(word, maxWidth, font);
    currentLine = segments.pop() ?? "";
    lines.push(...segments);
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function splitLongWord(
  word: string,
  maxWidth: number,
  font: string,
): string[] {
  const segments: string[] = [];
  let currentSegment = "";

  for (const character of Array.from(word)) {
    const candidate = `${currentSegment}${character}`;
    if (!currentSegment || measureTextWidth(candidate, font) <= maxWidth) {
      currentSegment = candidate;
      continue;
    }

    segments.push(currentSegment);
    currentSegment = character;
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
}

function ellipsizeText(value: string, maxWidth: number, font: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "...";
  }

  if (measureTextWidth(`${trimmedValue}...`, font) <= maxWidth) {
    return `${trimmedValue}...`;
  }

  let result = trimmedValue;

  while (result.length > 0) {
    result = result.slice(0, -1).trimEnd();
    if (!result) {
      break;
    }

    if (measureTextWidth(`${result}...`, font) <= maxWidth) {
      return `${result}...`;
    }
  }

  return "...";
}

function getMeasurementContext(): CanvasRenderingContext2D {
  if (measurementContext) {
    return measurementContext;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to measure export text.");
  }

  measurementContext = context;
  return context;
}
