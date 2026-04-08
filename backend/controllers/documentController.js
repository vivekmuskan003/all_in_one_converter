/**
 * Document Converter
 * - DOCX/DOC → PDF : mammoth (styled HTML) + Puppeteer (headless Chrome) → pixel-near-perfect PDF
 * - PDF → TXT      : pdfjs-dist with proper coordinate sorting (top-to-bottom, left-to-right)
 * - PDF → DOCX     : pdfjs-dist layout analysis → docx package (structured Word document)
 * - TXT → PDF/DOCX : pdf-lib / html-to-docx
 * - HTML → PDF/DOCX: Puppeteer / html-to-docx
 */

const path    = require('path');
const fs      = require('fs');
const mammoth = require('mammoth');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const cleanup = (...paths) => paths.forEach(p => { try { fs.unlinkSync(p); } catch {} });

// ─── Puppeteer launcher ───────────────────────────────────────────────────────
async function launchBrowser() {
  try {
    const puppeteer = require('puppeteer');
    return await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
  } catch {}
  try {
    const puppeteer = require('puppeteer-core');
    const chromium  = require('@sparticuz/chromium');
    return await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  } catch {}
  throw new Error('Puppeteer not found. Run: npm install puppeteer');
}

// ─── DOCX → styled HTML (mammoth with full style map) ────────────────────────
async function docxToStyledHtml(filePath) {
  const result = await mammoth.convertToHtml({ path: filePath }, {
    styleMap: [
      // Headings
      "p[style-name='Heading 1']           => h1:fresh",
      "p[style-name='Heading 2']           => h2:fresh",
      "p[style-name='Heading 3']           => h3:fresh",
      "p[style-name='Heading 4']           => h4:fresh",
      "p[style-name='Heading 5']           => h5:fresh",
      // Title / Subtitle
      "p[style-name='Title']               => h1.doc-title:fresh",
      "p[style-name='Subtitle']            => p.doc-subtitle:fresh",
      // Common resume section styles
      "p[style-name='Section Heading']     => h2.section-heading:fresh",
      "p[style-name='Section Title']       => h2.section-heading:fresh",
      // List styles
      "p[style-name='List Paragraph']      => p.list-paragraph:fresh",
      "p[style-name='List Bullet']         => li:fresh",
      "p[style-name='List Number']         => li.numbered:fresh",
      // Inline
      "b                                   => strong",
      "i                                   => em",
      "u                                   => u",
      "strike                              => s",
      "comment-reference                   => sup",
      // Preserve hyperlinks but style them as plain text
      "a[href]                             => a",
    ],
    convertImage: mammoth.images.imgElement(image =>
      image.read('base64').then(data => ({
        src: `data:${image.contentType};base64,${data}`,
      }))
    ),
    ignoreEmptyParagraphs: false,
  });
  return result.value;
}

// ─── Full HTML page wrapper with print-ready CSS ──────────────────────────────
function wrapHtml(bodyHtml, title = 'Document') {

  // ── Post-process mammoth HTML ──────────────────────────────────────────────

  let processed = bodyHtml

    // 1. Tab-separated lines → flex row (left content + right-aligned date)
    //    mammoth outputs \t literally inside <p> tags
    .replace(/<p([^>]*)>([\s\S]*?)\t([\s\S]*?)<\/p>/g, (match, attrs, left, right) => {
      const l = left.trim();
      const r = right.trim();
      if (!l && !r) return `<p${attrs}></p>`;
      if (!r) return `<p${attrs}>${l}</p>`;
      return `<p${attrs} class="tab-row"><span class="tab-left">${l}</span><span class="tab-right">${r}</span></p>`;
    })

    // 2. Strip blue link styling — make all links plain black text
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, (_, href, text) =>
      `<a href="${href}" class="doc-link">${text}</a>`
    )

    // 3. The first <h1> is the document name — give it a special class
    //    so it doesn't get the section-heading border/uppercase treatment
    .replace(/<h1([^>]*)>/, '<h1$1 class="doc-name">')

    // 4. Empty paragraphs that are just spacing — keep as spacers
    .replace(/<p><\/p>/g, '<p class="spacer"></p>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @page { size: A4; margin: 1.8cm 2cm 1.8cm 2cm; }

  * { box-sizing: border-box; }

  body {
    font-family: 'Times New Roman', 'Georgia', serif;
    font-size: 10.5pt;
    line-height: 1.45;
    color: #000;
    background: #fff;
    margin: 0;
    padding: 0;
  }

  /* ── Document name (first h1 = person's name) ── */
  h1.doc-name {
    font-size: 20pt;
    font-weight: 700;
    text-align: center;
    margin: 0 0 3pt;
    padding: 0;
    border: none;
    text-transform: none;
    letter-spacing: 0;
  }

  /* ── Title / Subtitle styles (Word Title paragraph style) ── */
  h1.doc-title {
    font-size: 20pt;
    font-weight: 700;
    text-align: center;
    margin: 0 0 3pt;
    padding: 0;
    border: none;
    text-transform: none;
  }
  p.doc-subtitle {
    text-align: center;
    font-size: 10pt;
    margin: 0 0 2pt;
  }

  /* ── Section headings: h2 and h3 get the divider line ── */
  h2, h3 {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3pt;
    margin: 10pt 0 3pt;
    padding-bottom: 2pt;
    border-bottom: 1.5px solid #000;
    color: #000;
    text-decoration: none;
  }
  h2.section-heading {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    border-bottom: 1.5px solid #000;
    padding-bottom: 2pt;
    margin: 10pt 0 3pt;
  }

  /* h1 that is NOT the doc-name (fallback) */
  h1:not(.doc-name):not(.doc-title) {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    margin: 10pt 0 3pt;
    padding-bottom: 2pt;
    border-bottom: 1.5px solid #000;
  }

  h4, h5 { font-size: 10.5pt; font-weight: 700; margin: 5pt 0 2pt; }

  /* ── Paragraphs ── */
  p { margin: 0 0 3pt; orphans: 3; widows: 3; }
  p.spacer { margin: 0; height: 4pt; }

  /* ── Centered paragraphs (contact info) ── */
  p[style*="text-align: center"],
  p[style*="text-align:center"],
  .center { text-align: center; }

  /* ── Tab-row: left text + right-aligned date ── */
  p.tab-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin: 0 0 2pt;
    gap: 8pt;
  }
  .tab-left  { flex: 1 1 auto; }
  .tab-right { flex: 0 0 auto; text-align: right; white-space: nowrap; }

  /* ── Lists ── */
  ul { list-style: disc;    margin: 2pt 0 4pt 20pt; padding: 0; }
  ol { list-style: decimal; margin: 2pt 0 4pt 20pt; padding: 0; }
  li { margin-bottom: 2pt; line-height: 1.4; }

  /* List Paragraph style from Word (indented bullet paragraphs) */
  p.list-paragraph {
    padding-left: 20pt;
    margin-bottom: 2pt;
    text-indent: -10pt;
  }
  p.list-paragraph::before { content: '•  '; }

  /* ── Tables ── */
  table { border-collapse: collapse; width: 100%; margin: 4pt 0 6pt; page-break-inside: avoid; }
  td, th { border: 1px solid #999; padding: 3pt 5pt; vertical-align: top; font-size: 10pt; }
  th { background: #f0f0f0; font-weight: 700; }

  /* ── Inline ── */
  strong, b { font-weight: 700; }
  em, i     { font-style: italic; }
  u         { text-decoration: underline; }
  s         { text-decoration: line-through; }
  sup       { font-size: 7pt; vertical-align: super; }
  sub       { font-size: 7pt; vertical-align: sub; }

  /* ── Links: plain black, no blue ── */
  a, a.doc-link { color: #000; text-decoration: none; }

  /* ── Images ── */
  img { max-width: 100%; height: auto; display: block; margin: 4pt 0; }

  /* ── Code ── */
  pre, code { font-family: 'Courier New', monospace; font-size: 9pt; background: #f5f5f5; padding: 1pt 3pt; }
  pre { padding: 6pt 8pt; white-space: pre-wrap; word-break: break-word; margin: 4pt 0; }

  /* ── HR ── */
  hr { border: none; border-top: 1px solid #000; margin: 6pt 0; }
</style>
</head>
<body>${processed}</body>
</html>`;
}

// ─── HTML → PDF via Puppeteer ─────────────────────────────────────────────────
async function htmlToPdf(html, outPath) {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '1.8cm', right: '2cm', bottom: '1.8cm', left: '2cm' },
      displayHeaderFooter: false,
    });
  } finally {
    await browser.close();
  }
}

// ─── PDF → rich structured data (items with position + font info) ─────────────
async function extractPdfItems(filePath) {
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  pdfjsLib.GlobalWorkerOptions.workerSrc = false;

  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc  = await pdfjsLib.getDocument({
    data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true,
  }).promise;

  const pages = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page     = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const content  = await page.getTextContent({ normalizeWhitespace: false, includeMarkedContent: false });

    const items = content.items
      .filter(item => 'str' in item && item.str.trim().length > 0)
      .map(item => {
        const fontSize = Math.abs(item.transform[3]) || Math.abs(item.transform[0]) || 12;
        return {
          str:      item.str,
          x:        item.transform[4],
          y:        viewport.height - item.transform[5], // flip to top-down
          width:    item.width,
          height:   item.height || fontSize,
          fontSize: Math.round(fontSize * 10) / 10,
          bold:     item.fontName ? /bold|heavy|black/i.test(item.fontName) : false,
          italic:   item.fontName ? /italic|oblique/i.test(item.fontName) : false,
          fontName: item.fontName || '',
        };
      });

    pages.push({ pageNum, width: viewport.width, height: viewport.height, items });
  }

  return pages;
}

// ─── Group items into visual lines ────────────────────────────────────────────
function groupIntoLines(items, lineThreshold = 4) {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines  = [];
  let cur      = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i].y - cur[0].y) <= lineThreshold) {
      cur.push(sorted[i]);
    } else {
      lines.push(cur.sort((a, b) => a.x - b.x));
      cur = [sorted[i]];
    }
  }
  lines.push(cur.sort((a, b) => a.x - b.x));
  return lines;
}

// ─── Merge line items into a single line object ───────────────────────────────
function mergeLine(lineItems, pageWidth) {
  let text = lineItems[0].str;
  for (let i = 1; i < lineItems.length; i++) {
    const prev = lineItems[i - 1];
    const curr = lineItems[i];
    const gap  = curr.x - (prev.x + prev.width);
    text += (gap > 6 ? ' ' : '') + curr.str;
  }

  const avgFontSize = lineItems.reduce((s, i) => s + i.fontSize, 0) / lineItems.length;
  const isBold      = lineItems.some(i => i.bold) || lineItems.every(i => i.fontSize > 13);
  const isItalic    = lineItems.some(i => i.italic);
  const leftX       = lineItems[0].x;
  const rightX      = lineItems[lineItems.length - 1].x + lineItems[lineItems.length - 1].width;
  const centerX     = (leftX + rightX) / 2;
  const pageMid     = pageWidth / 2;
  const isCentered  = Math.abs(centerX - pageMid) < pageWidth * 0.12;

  // Detect tab-separated content (large gap in middle of line)
  let tabLeft = null, tabRight = null;
  for (let i = 1; i < lineItems.length; i++) {
    const gap = lineItems[i].x - (lineItems[i-1].x + lineItems[i-1].width);
    if (gap > pageWidth * 0.25) {
      tabLeft  = lineItems.slice(0, i).map(x => x.str).join(' ').trim();
      tabRight = lineItems.slice(i).map(x => x.str).join(' ').trim();
      break;
    }
  }

  return { text: text.trim(), avgFontSize, isBold, isItalic, isCentered, tabLeft, tabRight, leftX, pageWidth };
}

// ─── Classify a line into a document element type ─────────────────────────────
function classifyLine(line, medianFontSize) {
  const { text, avgFontSize, isBold, isCentered, tabLeft } = line;
  if (!text) return 'empty';

  // Bullet point
  if (/^[•·▪▸\-–—]\s/.test(text) || /^\s*[•·▪▸]\s/.test(text)) return 'bullet';

  // Large centered text = name/title
  if (isCentered && avgFontSize >= medianFontSize * 1.4) return 'title';

  // Centered normal text = subtitle/contact
  if (isCentered) return 'center';

  // Bold + larger than body = section heading
  if (isBold && avgFontSize >= medianFontSize * 1.05 && text.length < 60) return 'heading';

  // All caps short line = section heading
  if (text === text.toUpperCase() && text.length < 50 && text.length > 2 && /[A-Z]/.test(text)) return 'heading';

  // Tab-separated = two-column row
  if (tabLeft) return 'tabrow';

  return 'paragraph';
}

// ─── PDF → plain text (for TXT export) ───────────────────────────────────────
async function pdfToText(filePath) {
  const pages = await extractPdfItems(filePath);
  const result = [];

  for (const { items, width } of pages) {
    const lines = groupIntoLines(items);
    for (const lineItems of lines) {
      const line = mergeLine(lineItems, width);
      if (line.tabLeft) {
        result.push(`${line.tabLeft}\t${line.tabRight}`);
      } else {
        result.push(line.text);
      }
    }
    result.push('');
  }

  return result.join('\n');
}

// ─── PDF → proper DOCX with structure ────────────────────────────────────────
async function pdfToDocx(filePath) {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    AlignmentType, TabStopType, TabStopPosition,
    BorderStyle, Table, TableRow, TableCell, WidthType,
  } = require('docx');

  const pages = await extractPdfItems(filePath);
  const docChildren = [];

  for (const { items, width, pageNum } of pages) {
    if (pageNum > 1) {
      // Page break between pages
      docChildren.push(new Paragraph({ pageBreakBefore: true, children: [] }));
    }

    const lines = groupIntoLines(items);
    if (!lines.length) continue;

    // Calculate median font size for this page (= body text size)
    const fontSizes = lines.flatMap(l => l.map(i => i.fontSize)).sort((a, b) => a - b);
    const medianFontSize = fontSizes[Math.floor(fontSizes.length / 2)] || 11;

    for (const lineItems of lines) {
      const line = mergeLine(lineItems, width);
      if (!line.text) continue;

      const type = classifyLine(line, medianFontSize);

      // Clean bullet prefix
      const cleanText = line.text.replace(/^[•·▪▸]\s*/, '').trim();

      switch (type) {
        case 'title':
          docChildren.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: line.text,
              bold: true,
              size: Math.round(line.avgFontSize * 2), // half-points
              font: 'Times New Roman',
            })],
            spacing: { after: 80 },
          }));
          break;

        case 'center':
          docChildren.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: line.text,
              size: Math.round(medianFontSize * 2),
              font: 'Times New Roman',
            })],
            spacing: { after: 40 },
          }));
          break;

        case 'heading':
          docChildren.push(new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({
              text: line.text,
              bold: true,
              size: Math.round(medianFontSize * 2),
              font: 'Times New Roman',
              allCaps: true,
            })],
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            },
            spacing: { before: 160, after: 60 },
          }));
          break;

        case 'bullet':
          docChildren.push(new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({
              text: cleanText,
              size: Math.round(medianFontSize * 2),
              font: 'Times New Roman',
              bold: line.isBold,
              italics: line.isItalic,
            })],
            spacing: { after: 40 },
          }));
          break;

        case 'tabrow':
          // Two-column row: left text + right-aligned date
          docChildren.push(new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({
                text: line.tabLeft,
                size: Math.round(medianFontSize * 2),
                font: 'Times New Roman',
                bold: line.isBold,
                italics: line.isItalic,
              }),
              new TextRun({ text: '\t' }),
              new TextRun({
                text: line.tabRight,
                size: Math.round(medianFontSize * 2),
                font: 'Times New Roman',
              }),
            ],
            spacing: { after: 40 },
          }));
          break;

        default: // paragraph
          docChildren.push(new Paragraph({
            children: [new TextRun({
              text: line.text,
              size: Math.round(medianFontSize * 2),
              font: 'Times New Roman',
              bold: line.isBold,
              italics: line.isItalic,
            })],
            spacing: { after: 40 },
          }));
      }
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 22 },
          paragraph: { spacing: { after: 60 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1080, right: 1134, bottom: 1080, left: 1134 }, // ~1.9cm margins
        },
      },
      children: docChildren,
    }],
  });

  return Packer.toBuffer(doc);
}

// ─── Plain text → PDF (fallback, no Puppeteer) ───────────────────────────────
async function textToPdf(text) {
  const pdfDoc   = await PDFDocument.create();
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const lineH    = 16;
  const margin   = 60;
  const W = 595, H = 842;
  const maxChars = Math.floor((W - margin * 2) / (fontSize * 0.55));

  const wrapped = [];
  for (const raw of text.split('\n')) {
    if (!raw.trim()) { wrapped.push(''); continue; }
    for (let i = 0; i < raw.length; i += maxChars) wrapped.push(raw.slice(i, i + maxChars));
  }

  let page = pdfDoc.addPage([W, H]);
  let y = H - margin;
  for (const line of wrapped) {
    if (y < margin) { page = pdfDoc.addPage([W, H]); y = H - margin; }
    if (line) page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
    y -= lineH;
  }
  return pdfDoc.save();
}

// ─── HTML → DOCX ─────────────────────────────────────────────────────────────
async function htmlToDocx(html) {
  const HTMLtoDOCX = require('html-to-docx');
  return HTMLtoDOCX(html, null, {
    table: { row: { cantSplit: true } },
    footer: false,
    pageNumber: false,
    font: 'Calibri',
    fontSize: 22,
  });
}

// ─── Main handler ─────────────────────────────────────────────────────────────
exports.convert = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const { outputFormat } = req.body;
  if (!outputFormat) return res.status(400).json({ error: 'Output format required' });

  const inputExt = path.extname(file.originalname).toLowerCase().replace('.', '');
  const fmt      = outputFormat.toLowerCase();
  const outName  = `doc_${Date.now()}.${fmt}`;
  const outPath  = path.join('uploads', outName);

  const send = () => res.download(outPath, outName, () => cleanup(file.path, outPath));
  const fail = (msg, code = 422) => { cleanup(file.path); res.status(code).json({ error: msg }); };

  try {

    // ── DOCX/DOC → PDF (Puppeteer — best quality) ─────────────────────────
    if (['docx', 'doc'].includes(inputExt) && fmt === 'pdf') {
      const bodyHtml = await docxToStyledHtml(file.path);
      const fullHtml = wrapHtml(bodyHtml, file.originalname);
      await htmlToPdf(fullHtml, outPath);
      return send();
    }

    // ── DOCX/DOC → TXT ────────────────────────────────────────────────────
    if (['docx', 'doc'].includes(inputExt) && fmt === 'txt') {
      const result = await mammoth.extractRawText({ path: file.path });
      fs.writeFileSync(outPath, result.value, 'utf8');
      return send();
    }

    // ── DOCX/DOC → HTML ───────────────────────────────────────────────────
    if (['docx', 'doc'].includes(inputExt) && fmt === 'html') {
      const bodyHtml = await docxToStyledHtml(file.path);
      fs.writeFileSync(outPath, wrapHtml(bodyHtml, file.originalname), 'utf8');
      return send();
    }

    // ── TXT → PDF ─────────────────────────────────────────────────────────
    if (inputExt === 'txt' && fmt === 'pdf') {
      const text  = fs.readFileSync(file.path, 'utf8');
      const bytes = await textToPdf(text);
      fs.writeFileSync(outPath, bytes);
      return send();
    }

    // ── TXT → DOCX ────────────────────────────────────────────────────────
    if (inputExt === 'txt' && fmt === 'docx') {
      const text = fs.readFileSync(file.path, 'utf8');
      const escaped = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const html = `<html><body><pre style="font-family:Calibri,Arial;font-size:11pt;white-space:pre-wrap">${escaped}</pre></body></html>`;
      const buf  = await htmlToDocx(html);
      fs.writeFileSync(outPath, buf);
      return send();
    }

    // ── PDF → TXT (proper coordinate sorting) ─────────────────────────────
    if (inputExt === 'pdf' && fmt === 'txt') {
      const text = await pdfToText(file.path);
      fs.writeFileSync(outPath, text, 'utf8');
      return send();
    }

    // ── PDF → DOCX (structured, layout-aware) ────────────────────────────
    if (inputExt === 'pdf' && fmt === 'docx') {
      const buf = await pdfToDocx(file.path);
      fs.writeFileSync(outPath, buf);
      return send();
    }

    // ── HTML → PDF ────────────────────────────────────────────────────────
    if (inputExt === 'html' && fmt === 'pdf') {
      const html = fs.readFileSync(file.path, 'utf8');
      await htmlToPdf(html, outPath);
      return send();
    }

    // ── HTML → DOCX ───────────────────────────────────────────────────────
    if (inputExt === 'html' && fmt === 'docx') {
      const html = fs.readFileSync(file.path, 'utf8');
      const buf  = await htmlToDocx(html);
      fs.writeFileSync(outPath, buf);
      return send();
    }

    return fail(
      `${inputExt.toUpperCase()} → ${fmt.toUpperCase()} is not supported. ` +
      `Supported: DOCX/DOC→PDF/TXT/HTML, TXT→PDF/DOCX, PDF→TXT/DOCX, HTML→PDF/DOCX`
    );

  } catch (err) {
    cleanup(file.path);
    if (err.message?.includes('Puppeteer') || err.message?.includes('Chrome') || err.message?.includes('chromium')) {
      return res.status(500).json({ error: 'PDF rendering requires Puppeteer. Run: npm install puppeteer' });
    }
    res.status(500).json({ error: err.message });
  }
};
