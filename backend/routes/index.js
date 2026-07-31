const express = require('express');
const router = express.Router();

// Import all route modules
const adminRoutes = require('./admin');
const collegeRoutes = require('./college');
const collegeDashboardRoutes = require('./collegeDashboard');
const departmentRoutes = require('./departments');
const teacherRoutes = require('./teachers');
const studentRoutes = require('./students');
const studentRequestRoutes = require('./studentRequests');
const parentRoutes = require('./parent');

// Register routes
router.use('/admin', adminRoutes);
router.use('/college', collegeRoutes);
router.use('/college-dashboard', collegeDashboardRoutes);
router.use('/departments', departmentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/students', studentRoutes);
router.use('/student-requests', studentRequestRoutes);
router.use('/parents', parentRoutes);

module.exports = router;