const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

// Public routes
router.post('/register', studentController.register);
router.post('/login', studentController.login);

// Protected routes
router.get('/college', authenticateToken, studentController.getStudents);
router.get('/:id', authenticateToken, studentController.getStudent);
router.post('/', authenticateToken, studentController.addStudent);
router.put('/:id', authenticateToken, studentController.updateStudent);
router.delete('/:id', authenticateToken, studentController.deleteStudent);

module.exports = router;