const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const teacherController = require('../controllers/teacherController');

// Public routes
router.post('/register', teacherController.register);
router.post('/login', teacherController.login);

// Protected routes
router.get('/college/:collegeCode', authenticateToken, teacherController.getTeachers);
router.post('/college/:collegeCode', authenticateToken, teacherController.addTeacher);
router.put('/:teacherId', authenticateToken, teacherController.updateTeacher);
router.delete('/:teacherId', authenticateToken, teacherController.deleteTeacher);

module.exports = router;