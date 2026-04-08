const express = require('express');
const router = express.Router();
const { createUpload, handleUploadError } = require('../middleware/upload');
const fileController = require('../controllers/fileController');
const trackUsage = require('../middleware/trackUsage');

const upload = createUpload(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'webp', 'zip', 'txt', 'csv']);

router.post(
  '/compress',
  trackUsage('compression'),
  (req, res, next) => upload.single('file')(req, res, (err) => handleUploadError(err, req, res, next)),
  fileController.compress
);

module.exports = router;
