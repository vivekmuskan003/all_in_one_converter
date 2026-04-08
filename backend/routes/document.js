const express = require('express');
const router = express.Router();
const { createUpload, handleUploadError } = require('../middleware/upload');
const documentController = require('../controllers/documentController');
const trackUsage = require('../middleware/trackUsage');

const upload = createUpload(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'rtf', 'odt']);

router.post(
  '/convert',
  trackUsage('document'),
  (req, res, next) => upload.single('file')(req, res, (err) => handleUploadError(err, req, res, next)),
  documentController.convert
);

module.exports = router;
