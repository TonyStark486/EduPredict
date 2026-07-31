const pool = require('../db');

// Get prediction for a student
const getPrediction = async (req, res) => {
  try {
    const { studentId } = req.params;
    const collegeCode = req.college.college_code;

    const result = await pool.query(
      `SELECT p.*, s.name as student_name, s.roll_no
       FROM predictions p
       JOIN students s ON p.student_id = s.id
       WHERE p.student_id = $1 AND s.college_code = $2
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [studentId, collegeCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No prediction found for this student' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching prediction:', err);
    res.status(500).json({ error: 'Failed to fetch prediction' });
  }
};

// Generate prediction for a student
const generatePrediction = async (req, res) => {
  try {
    const { studentId } = req.params;
    const collegeCode = req.college.college_code;

    // Get student data
    const studentResult = await pool.query(
      `SELECT s.*, 
        COALESCE(AVG(a.percentage), 0) as attendance_percentage,
        COALESCE(AVG(g.gpa), 0) as current_gpa
       FROM students s
       LEFT JOIN attendance a ON s.id = a.student_id
       LEFT JOIN grades g ON s.id = g.student_id
       WHERE s.id = $1 AND s.college_code = $2
       GROUP BY s.id`,
      [studentId, collegeCode]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = studentResult.rows[0];

    // Calculate risk factors
    let riskScore = 0;
    const riskFactors = [];

    // Attendance risk (if attendance < 75%)
    if (student.attendance_percentage < 75) {
      riskScore += 40;
      riskFactors.push({
        factor: "Low Attendance",
        severity: student.attendance_percentage < 60 ? "High" : "Medium",
        recommendation: "Contact parents and implement attendance improvement plan"
      });
    }

    // GPA risk (if GPA < 6.0)
    if (student.current_gpa < 6.0) {
      riskScore += 35;
      riskFactors.push({
        factor: "Low Academic Performance",
        severity: student.current_gpa < 4.0 ? "High" : "Medium",
        recommendation: "Arrange extra tutoring and academic counseling"
      });
    }

    // Backlogs risk
    if (student.backlogs && student.backlogs > 0) {
      riskScore += Math.min(student.backlogs * 10, 30);
      riskFactors.push({
        factor: "Backlogs",
        severity: student.backlogs > 3 ? "High" : "Medium",
        recommendation: "Provide backlog clearance support and mentoring"
      });
    }

    // Determine risk level
    let riskLevel = "Low";
    if (riskScore >= 70) riskLevel = "High";
    else if (riskScore >= 40) riskLevel = "Medium";

    // Generate prediction
    const prediction = {
      studentId: student.id,
      studentName: student.name,
      riskLevel: riskLevel,
      riskScore: riskScore,
      riskFactors: riskFactors,
      recommendations: generateRecommendations(riskFactors),
      lastUpdated: new Date().toISOString()
    };

    // Save prediction to database
    const result = await pool.query(
      `INSERT INTO predictions (student_id, risk_level, risk_score, prediction_data, created_at) 
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [studentId, riskLevel, riskScore, JSON.stringify(prediction)]
    );

    // Update student alert status
    await pool.query(
      `UPDATE students SET alert_status = $1 WHERE id = $2`,
      [riskLevel === 'High' ? 1 : 0, studentId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error generating prediction:', err);
    res.status(500).json({ error: 'Failed to generate prediction' });
  }
};

// Get all predictions for a college
const getCollegePredictions = async (req, res) => {
  try {
    const collegeCode = req.college.college_code;

    const result = await pool.query(
      `SELECT p.*, s.name as student_name, s.roll_number, s.course, s.semester
       FROM predictions p
       JOIN students s ON p.student_id = s.id
       WHERE s.college_code = $1
       ORDER BY p.created_at DESC
       LIMIT 50`,
      [collegeCode]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching predictions:', err);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
};

// Helper function to generate recommendations
function generateRecommendations(riskFactors) {
  const recommendations = [];
  
  for (const factor of riskFactors) {
    recommendations.push(factor.recommendation);
  }
  
  recommendations.push("Schedule regular parent-teacher meetings");
  recommendations.push("Monitor weekly progress reports");
  
  return [...new Set(recommendations)];
}

module.exports = {
  getPrediction,
  generatePrediction,
  getCollegePredictions
};