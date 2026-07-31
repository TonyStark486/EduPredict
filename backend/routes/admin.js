const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Admin authentication
router.post('/login', adminController.login);
router.get('/verify', authenticateAdmin, adminController.verify);
router.post('/setup', adminController.setup);

// College management
router.get('/colleges', authenticateAdmin, adminController.getColleges);
router.get('/colleges/:id', authenticateAdmin, adminController.getCollege);
router.post('/colleges', authenticateAdmin, adminController.addCollege);
router.put('/colleges/:id', authenticateAdmin, adminController.updateCollege);
router.delete('/colleges/:id', authenticateAdmin, adminController.deleteCollege);

// Statistics
router.get('/stats', authenticateAdmin, adminController.getStats);

module.exports = router;