const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const departmentController = require('../controllers/departmentController');

// Get departments for college (public for frontend)
router.get('/:collegeCode', departmentController.getDepartments);

// Protected routes
router.post('/:collegeCode', authenticateToken, departmentController.addDepartment);
router.put('/:id', authenticateToken, departmentController.updateDepartment);
router.delete('/:id', authenticateToken, departmentController.deleteDepartment);

// Get students by department
router.get('/:departmentCode/students', departmentController.getStudents);

// Get yearly summary
router.get('/:departmentCode/years/summary', departmentController.getYearlySummary);

module.exports = router;