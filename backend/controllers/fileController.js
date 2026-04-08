const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');

exports.compress = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const { level, createZip } = req.body;
  const compressionLevel = level || 'medium';
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

  const cleanup = (...paths) => paths.forEach(p => { try { fs.unlinkSync(p); } catch {} });

  try {
    // ── ZIP archive ─────────────────────────────────────────────
    if (createZip === 'true' || ext === 'zip') {
      const zlibLevel = compressionLevel === 'high' ? 9 : compressionLevel === 'low' ? 1 : 6;
      const outName = `archive_${Date.now()}.zip`;
      const outPath = path.join('uploads', outName);
      const output = fs.createWriteStream(outPath);
      const archive = archiver('zip', { zlib: { level: zlibLevel } });

      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);
        archive.file(file.path, { name: file.originalname });
        archive.finalize();
      });

      return res.download(outPath, outName, () => cleanup(file.path, outPath));
    }

    // ── Image compression ────────────────────────────────────────
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      // quality: low=40, medium=65, high=85
      const qualityMap = { low: 35, medium: 60, high: 80 };
      const q = qualityMap[compressionLevel] || 60;
      const pngLevel = compressionLevel === 'high' ? 3 : compressionLevel === 'low' ? 9 : 7;

      const outName = `compressed_${Date.now()}.${ext}`;
      const outPath = path.join('uploads', outName);

      let s = sharp(file.path);
      if (ext === 'png') {
        s = s.png({ compressionLevel: pngLevel, adaptiveFiltering: true, palette: compressionLevel === 'low' });
      } else if (ext === 'webp') {
        s = s.webp({ quality: q, effort: 6 });
      } else {
        // jpg / jpeg
        s = s.jpeg({ quality: q, mozjpeg: true, chromaSubsampling: '4:2:0' });
      }

      await s.toFile(outPath);
      return res.download(outPath, outName, () => cleanup(file.path, outPath));
    }

    // ── PDF compression ──────────────────────────────────────────
    if (ext === 'pdf') {
      const inputBytes = fs.readFileSync(file.path);
      const pdfDoc = await PDFDocument.load(inputBytes);
      const outputBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
      const outName = `compressed_${Date.now()}.pdf`;
      const outPath = path.join('uploads', outName);
      fs.writeFileSync(outPath, outputBytes);
      return res.download(outPath, outName, () => cleanup(file.path, outPath));
    }

    // ── Everything else → ZIP ────────────────────────────────────
    const zlibLevel = compressionLevel === 'high' ? 9 : compressionLevel === 'low' ? 1 : 6;
    const outName = `compressed_${Date.now()}.zip`;
    const outPath = path.join('uploads', outName);
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: zlibLevel } });

    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.file(file.path, { name: file.originalname });
      archive.finalize();
    });

    res.download(outPath, outName, () => cleanup(file.path, outPath));

  } catch (err) {
    try { fs.unlinkSync(file.path); } catch {}
    res.status(500).json({ error: err.message });
  }
};
