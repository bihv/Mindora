import type { MindMapDocument } from "../../domain/mindmap/model";
import { PDF_MARGIN, PX_TO_PT } from "./config";
import { buildPdfFromJpeg } from "./pdf";
import { canvasToBlob, renderSnapshotToCanvas } from "./raster";
import { buildExportSnapshot } from "./snapshot";
import { buildSvgMarkup } from "./svg";
import type { ExportFormat } from "./types";

export async function buildMindMapExportBlob(
  document: MindMapDocument,
  format: ExportFormat,
): Promise<Blob> {
  const snapshot = buildExportSnapshot(document);
  const svgMarkup = buildSvgMarkup(snapshot);

  if (format === "svg") {
    return new Blob([svgMarkup], {
      type: "image/svg+xml;charset=utf-8",
    });
  }

  const canvas = await renderSnapshotToCanvas(snapshot, svgMarkup);

  if (format === "png") {
    return await canvasToBlob(canvas, "image/png");
  }

  const jpegBlob = await canvasToBlob(canvas, "image/jpeg", 0.92);
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const pdfBytes = buildPdfFromJpeg({
    jpegBytes,
    imageHeight: canvas.height,
    imageWidth: canvas.width,
    pageHeight: snapshot.height * PX_TO_PT + PDF_MARGIN * 2,
    pageWidth: snapshot.width * PX_TO_PT + PDF_MARGIN * 2,
  });

  return new Blob([pdfBytes], {
    type: "application/pdf",
  });
}

export * from "./types";
