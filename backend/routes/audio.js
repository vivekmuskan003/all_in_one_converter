const express = require('express');
const router = express.Router();
const { createUpload, handleUploadError } = require('../middleware/upload');
const audioController = require('../controllers/audioController');
const trackUsage = require('../middleware/trackUsage');

const upload = createUpload(['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a', 'wma', 'aiff', 'amr']);

router.post(
  '/convert',
  trackUsage('audio'),
  (req, res, next) => upload.single('file')(req, res, (err) => handleUploadError(err, req, res, next)),
  audioController.convert
);

module.exports = router;
