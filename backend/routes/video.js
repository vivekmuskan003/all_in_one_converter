const express = require('express');
const router = express.Router();
const { createUpload, handleUploadError } = require('../middleware/upload');
const videoController = require('../controllers/videoController');
const trackUsage = require('../middleware/trackUsage');

const upload = createUpload(['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'mpeg', 'mpg', '3gp']);

router.post(
  '/convert',
  trackUsage('video'),
  (req, res, next) => upload.single('file')(req, res, (err) => handleUploadError(err, req, res, next)),
  videoController.convert
);

module.exports = router;
