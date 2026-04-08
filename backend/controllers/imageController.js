const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

exports.compress = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const { outputFormat, quality } = req.body;

  // Normalize format — default to jpeg
  let fmt = (outputFormat || 'jpg').toLowerCase();
  if (fmt === 'jpg') fmt = 'jpeg';

  // Quality 1–100, default 80
  const q = Math.min(100, Math.max(1, parseInt(quality) || 80));

  // PNG compression level is 0–9 (inverse of quality)
  // quality 100 → level 0 (no compression), quality 10 → level 9 (max compression)
  const pngLevel = Math.round((100 - q) / 100 * 9);

  const ext = fmt === 'jpeg' ? 'jpg' : fmt;
  const outputFilename = `converted_${Date.now()}.${ext}`;
  const outputPath = path.join('uploads', outputFilename);

  try {
    let instance = sharp(file.path);

    switch (fmt) {
      case 'jpeg':
        instance = instance.jpeg({
          quality: q,
          mozjpeg: true,          // better compression
          chromaSubsampling: '4:2:0',
        });
        break;
      case 'png':
        instance = instance.png({
          compressionLevel: pngLevel,
          adaptiveFiltering: true,
          palette: q < 50,        // use palette (indexed) for aggressive compression
        });
        break;
      case 'webp':
        instance = instance.webp({
          quality: q,
          effort: 6,              // higher effort = smaller file
        });
        break;
      case 'tiff':
        instance = instance.tiff({
          quality: q,
          compression: 'lzw',
        });
        break;
      case 'bmp':
        instance = instance.bmp();
        break;
      default:
        // Fallback: convert to jpeg
        instance = instance.jpeg({ quality: q, mozjpeg: true });
        break;
    }

    await instance.toFile(outputPath);

    res.download(outputPath, outputFilename, () => {
      try { fs.unlinkSync(file.path); } catch {}
      try { fs.unlinkSync(outputPath); } catch {}
    });
  } catch (err) {
    try { fs.unlinkSync(file.path); } catch {}
    res.status(500).json({ error: 'Image processing failed: ' + err.message });
  }
};
