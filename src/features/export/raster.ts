import {
  MAX_EXPORT_CANVAS_EDGE,
  MAX_EXPORT_CANVAS_PIXELS,
  type ExportSnapshot,
} from "./config";

export async function renderSnapshotToCanvas(
  snapshot: ExportSnapshot,
  svgMarkup: string,
): Promise<HTMLCanvasElement> {
  const rasterScale = getRasterScale(snapshot.width, snapshot.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(snapshot.width * rasterScale));
  canvas.height = Math.max(1, Math.round(snapshot.height * rasterScale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create an export canvas.");
  }

  const svgBlob = new Blob([svgMarkup], {
    type: "image/svg+xml;charset=utf-8",
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);
    context.imageSmoothingEnabled = true;
    context.scale(rasterScale, rasterScale);
    context.drawImage(image, 0, 0, snapshot.width, snapshot.height);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }

  return canvas;
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to encode the exported file."));
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function getRasterScale(width: number, height: number): number {
  const desiredScale = 2;
  const edgeScale = Math.min(
    MAX_EXPORT_CANVAS_EDGE / Math.max(width, 1),
    MAX_EXPORT_CANVAS_EDGE / Math.max(height, 1),
  );
  const pixelScale = Math.sqrt(
    MAX_EXPORT_CANVAS_PIXELS / Math.max(width * height, 1),
  );

  return Math.min(desiredScale, edgeScale, pixelScale);
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => {
      reject(new Error("Unable to render the export preview."));
    };
    image.src = url;
  });
}
