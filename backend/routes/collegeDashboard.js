const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const collegeDashboardController = require('../controllers/collegeDashboardController');

// Get dashboard data
router.get('/dashboard', authenticateToken, collegeDashboardController.getDashboard);

// Get departments
router.get('/:collegeCode/departments', authenticateToken, collegeDashboardController.getDepartments);

// Add department
router.post('/:collegeCode/departments', authenticateToken, collegeDashboardController.addDepartment);

// Delete department
router.delete('/:collegeCode/departments/:departmentCode', authenticateToken, collegeDashboardController.deleteDepartment);

// Get students by department and year
router.get('/:collegeCode/departments/:departmentCode/students/:year', authenticateToken, collegeDashboardController.getStudentsByDepartment);

module.exports = router;