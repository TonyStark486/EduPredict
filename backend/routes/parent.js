const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const parentController = require('../controllers/parentController');

// Public routes
router.post('/register', parentController.register);
router.post('/login', parentController.login);

// Protected routes
router.get('/student/:studentId', authenticateToken, parentController.getParentsByStudent);
router.get('/:parentId', authenticateToken, parentController.getParent);
router.put('/:parentId', authenticateToken, parentController.updateParent);

module.exports = router;