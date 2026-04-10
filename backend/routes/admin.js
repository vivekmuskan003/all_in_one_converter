const express = require('express');
const router  = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware  = require('../middleware/auth');

router.post('/login',          adminController.login);
router.get('/dashboard',       authMiddleware, adminController.getDashboard);
router.get('/stats',           authMiddleware, adminController.getStats);
router.post('/reset',          authMiddleware, adminController.resetStats);

module.exports = router;
