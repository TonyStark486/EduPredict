const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const collegeController = require('../controllers/collegeController');

// Public routes (no authentication)
router.post('/register', collegeController.register);
router.post('/login', collegeController.login);

// Protected routes
router.get('/stats', authenticateToken, collegeController.getStats);
router.get('/recent-activities', authenticateToken, collegeController.getRecentActivities);
router.get('/profile', authenticateToken, collegeController.getProfile);
router.put('/profile', authenticateToken, collegeController.updateProfile);

module.exports = router;