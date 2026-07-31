const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const routes = require('./routes');

// ========================================
// CORS CONFIGURATION
// ========================================
const corsOptions = {
  origin: [
    'https://edu-predict-sih.vercel.app',
    'https://edupredict-l9eg.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

// ========================================
// MIDDLEWARE
// ========================================
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// ========================================
// TEST ENDPOINT
// ========================================
app.get('/', (req, res) => {
  res.json({ 
    message: 'EduPredict Backend API is running!',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      admin: '/api/admin',
      college: '/api/college',
      dashboard: '/api/college-dashboard',
      departments: '/api/departments',
      teachers: '/api/teachers',
      students: '/api/students',
      parents: '/api/parents',
      attendance: '/api/attendance',
      predictions: '/api/predictions',
      studentRequests: '/api/student-requests'
    }
  });
});

// ========================================
// ROUTES
// ========================================
app.use('/api', routes);

// ========================================
// ERROR HANDLERS
// ========================================
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path 
  });
});

// ========================================
// START SERVER
// ========================================
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
});

module.exports = app;