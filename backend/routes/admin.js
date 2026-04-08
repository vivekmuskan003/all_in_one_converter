const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

router.post('/login', adminController.login);
router.get('/dashboard', authMiddleware, adminController.getDashboard);

module.exports = router;
