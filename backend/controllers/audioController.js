const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

// Point fluent-ffmpeg to the bundled static binary
ffmpeg.setFfmpegPath(ffmpegPath);

exports.convert = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const { outputFormat, bitrate } = req.body;
  if (!outputFormat) return res.status(400).json({ error: 'Output format required' });

  const fmt = outputFormat.toLowerCase();
  const outputFilename = `audio_${Date.now()}.${fmt}`;
  const outputPath = path.join('uploads', outputFilename);
  const audioBitrate = bitrate || '192k';

  try {
    await new Promise((resolve, reject) => {
      const codec = getAudioCodec(fmt);
      let cmd = ffmpeg(file.path).toFormat(fmt);

      // Only set codec if we have a specific one (avoid codec errors for some formats)
      if (codec) cmd = cmd.audioCodec(codec);

      // Don't set bitrate for lossless formats
      if (!['flac', 'wav', 'aiff'].includes(fmt)) {
        cmd = cmd.audioBitrate(audioBitrate);
      }

      cmd.output(outputPath)
        .on('end', resolve)
        .on('error', (err) => reject(new Error(err.message)))
        .run();
    });

    res.download(outputPath, outputFilename, () => {
      try { fs.unlinkSync(file.path); } catch {}
      try { fs.unlinkSync(outputPath); } catch {}
    });
  } catch (err) {
    try { fs.unlinkSync(file.path); } catch {}
    res.status(500).json({ error: 'Audio conversion failed: ' + err.message });
  }
};

function getAudioCodec(fmt) {
  const codecs = {
    mp3: 'libmp3lame',
    wav: 'pcm_s16le',
    aac: 'aac',
    ogg: 'libvorbis',
    flac: 'flac',
    m4a: 'aac',
    aiff: 'pcm_s16be',
  };
  return codecs[fmt] || null;
}
