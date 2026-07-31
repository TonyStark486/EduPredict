const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');
const studentRequestController = require('../controllers/studentRequestController');

// Public route - Submit registration request
router.post('/submit', studentRequestController.submitRequest);

// Get all colleges (public)
router.get('/colleges', studentRequestController.getColleges);

// Get departments by college (public)
router.get('/colleges/:collegeCode/departments', studentRequestController.getDepartmentsByCollege);

// Protected routes
router.get('/:collegeCode/pending', authenticateToken, studentRequestController.getPendingRequests);
router.post('/:collegeCode/approve/:requestId', authenticateToken, studentRequestController.approveRequest);
router.post('/:collegeCode/reject/:requestId', authenticateToken, studentRequestController.rejectRequest);

module.exports = router;