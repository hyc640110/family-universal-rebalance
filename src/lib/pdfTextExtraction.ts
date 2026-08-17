import type { PdfTextPage } from './electronicStatementImport';

type PositionedText = { str?: unknown; transform?: unknown };
const readableLine = (items: PositionedText[]) => items
  .map(item => ({ text: typeof item.str === 'string' ? item.str.trim() : '', x: Array.isArray(item.transform) ? Number(item.transform[4]) : Number.NaN, y: Array.isArray(item.transform) ? Number(item.transform[5]) : Number.NaN }))
  .filter(item => item.text && Number.isFinite(item.x) && Number.isFinite(item.y));

/** Extracts only the PDF text layer. Images/OCR are deliberately out of scope. */
export async function extractTextPdfPages(file: File): Promise<PdfTextPage[]> {
  const [{ getDocument, GlobalWorkerOptions }, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  ]);
  GlobalWorkerOptions.workerSrc = worker.default;
  let loadingTask: ReturnType<typeof getDocument> | undefined;
  try {
    loadingTask = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    const document = await loadingTask.promise;
    const pages: PdfTextPage[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const content = await (await document.getPage(pageNumber)).getTextContent();
      const grouped = new Map<number, Array<{ text: string; x: number }>>();
      readableLine(content.items as PositionedText[]).forEach(item => {
        const y = Math.round(item.y * 2) / 2;
        grouped.set(y, [...(grouped.get(y) || []), { text: item.text, x: item.x }]);
      });
      pages.push({ pageNumber, lines: [...grouped.entries()].sort(([a], [b]) => b - a).map(([, items]) => items.sort((a, b) => a.x - b.x).map(item => item.text).join(' ')) });
    }
    return pages;
  } catch {
    throw new Error('PDF 無法讀取或不是支援的文字型 PDF。');
  } finally {
    await loadingTask?.destroy();
  }
}
