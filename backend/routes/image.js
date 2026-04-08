const express = require('express');
const router = express.Router();
const { createUpload, handleUploadError } = require('../middleware/upload');
const imageController = require('../controllers/imageController');
const trackUsage = require('../middleware/trackUsage');

const upload = createUpload(['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'svg']);

router.post(
  '/compress',
  trackUsage('image'),
  (req, res, next) => upload.single('file')(req, res, (err) => handleUploadError(err, req, res, next)),
  imageController.compress
);

module.exports = router;
