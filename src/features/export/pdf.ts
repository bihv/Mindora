import { PDF_MARGIN } from "./config";

export function buildPdfFromJpeg(params: {
  imageHeight: number;
  imageWidth: number;
  jpegBytes: Uint8Array;
  pageHeight: number;
  pageWidth: number;
}): Uint8Array {
  const { imageHeight, imageWidth, jpegBytes, pageHeight, pageWidth } = params;
  const drawWidth = pageWidth - PDF_MARGIN * 2;
  const drawHeight = pageHeight - PDF_MARGIN * 2;
  const contentStream = [
    "q",
    `${formatPdfNumber(drawWidth)} 0 0 ${formatPdfNumber(drawHeight)} ${PDF_MARGIN} ${PDF_MARGIN} cm`,
    "/Im0 Do",
    "Q",
  ].join("\n");
  const objects: Uint8Array[] = [
    encodePdfChunk("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"),
    encodePdfChunk("2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n"),
    encodePdfChunk(
      `3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${formatPdfNumber(pageWidth)} ${formatPdfNumber(pageHeight)}]
/Resources << /XObject << /Im0 4 0 R >> >>
/Contents 5 0 R
>>
endobj
`,
    ),
    concatPdfChunks([
      encodePdfChunk(
        `4 0 obj
<<
/Type /XObject
/Subtype /Image
/Width ${imageWidth}
/Height ${imageHeight}
/ColorSpace /DeviceRGB
/BitsPerComponent 8
/Filter /DCTDecode
/Length ${jpegBytes.length}
>>
stream
`,
      ),
      jpegBytes,
      encodePdfChunk("\nendstream\nendobj\n"),
    ]),
    encodePdfChunk(
      `5 0 obj
<< /Length ${contentStream.length} >>
stream
${contentStream}
endstream
endobj
`,
    ),
  ];

  const chunks: Uint8Array[] = [
    new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 255, 255, 255, 255, 10]),
  ];
  const offsets: number[] = [0];
  let currentOffset = chunks[0].length;

  for (const object of objects) {
    offsets.push(currentOffset);
    chunks.push(object);
    currentOffset += object.length;
  }

  const xrefOffset = currentOffset;
  const xrefRows = offsets
    .map((offset, index) =>
      index === 0
        ? "0000000000 65535 f "
        : `${offset.toString().padStart(10, "0")} 00000 n `,
    )
    .join("\n");
  const trailer = `xref
0 ${offsets.length}
${xrefRows}
trailer
<< /Size ${offsets.length} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`;

  chunks.push(encodePdfChunk(trailer));
  return concatPdfChunks(chunks);
}

function formatPdfNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function encodePdfChunk(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function concatPdfChunks(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}
