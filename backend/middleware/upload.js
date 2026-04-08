const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const MAX_SIZE = 100 * 1024 * 1024; // 100MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (allowedExts) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${ext} is not supported`), false);
  }
};

const createUpload = (allowedExts) =>
  multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter: fileFilter(allowedExts)
  });

// Express error handler for multer errors — call this after upload middleware
const handleUploadError = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum allowed size is 100MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = { createUpload, handleUploadError };
