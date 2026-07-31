const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const predictionController = require('../controllers/predictionController');

// Protected routes
router.get('/student/:studentId', authenticateToken, predictionController.getPrediction);
router.get('/college', authenticateToken, predictionController.getCollegePredictions);
router.post('/student/:studentId', authenticateToken, predictionController.generatePrediction);

module.exports = router;