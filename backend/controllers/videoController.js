const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);

exports.convert = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const { outputFormat, resolution, crf, enableCompression } = req.body;
  if (!outputFormat) return res.status(400).json({ error: 'Output format required' });

  const fmt = outputFormat.toLowerCase();
  const outputFilename = `video_${Date.now()}.${fmt}`;
  const outputPath = path.join('uploads', outputFilename);

  try {
    await new Promise((resolve, reject) => {
      let cmd = ffmpeg(file.path);

      const { vcodec, acodec } = getCodecs(fmt);
      if (vcodec) cmd = cmd.videoCodec(vcodec);
      if (acodec) cmd = cmd.audioCodec(acodec);

      // Apply CRF compression if enabled (only works with libx264/libvpx)
      if (enableCompression === 'true' && crf && ['libx264'].includes(vcodec)) {
        cmd = cmd.addOption('-crf', crf);
        cmd = cmd.addOption('-preset', 'fast');
      }

      // Apply resolution scaling
      if (resolution && resolution !== 'original') {
        const resMap = {
          '360p':  '640x360',
          '480p':  '854x480',
          '720p':  '1280x720',
          '1080p': '1920x1080',
          '4k':    '3840x2160',
        };
        if (resMap[resolution]) {
          cmd = cmd.size(resMap[resolution]).autopad();
        }
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
    res.status(500).json({ error: 'Video conversion failed: ' + err.message });
  }
};

function getCodecs(fmt) {
  const map = {
    mp4:  { vcodec: 'libx264',    acodec: 'aac' },
    avi:  { vcodec: 'libxvid',    acodec: 'mp3' },
    mkv:  { vcodec: 'libx264',    acodec: 'aac' },
    mov:  { vcodec: 'libx264',    acodec: 'aac' },
    wmv:  { vcodec: 'wmv2',       acodec: 'wmav2' },
    flv:  { vcodec: 'flv',        acodec: 'mp3' },
    webm: { vcodec: 'libvpx',     acodec: 'libvorbis' },
    '3gp':{ vcodec: 'libx264',    acodec: 'aac' },
    mpeg: { vcodec: 'mpeg2video', acodec: 'mp2' },
  };
  return map[fmt] || { vcodec: null, acodec: null };
}
