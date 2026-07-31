const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

// Protected routes
router.post('/', authenticateToken, attendanceController.markAttendance);
router.get('/student/:studentId', authenticateToken, attendanceController.getStudentAttendance);
router.get('/college', authenticateToken, attendanceController.getCollegeAttendance);
router.put('/:id', authenticateToken, attendanceController.updateAttendance);
router.delete('/:id', authenticateToken, attendanceController.deleteAttendance);

module.exports = router;