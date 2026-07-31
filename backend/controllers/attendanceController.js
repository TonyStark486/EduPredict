const pool = require('../db');

// Mark attendance
const markAttendance = async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    const { studentId, date, status, semester, subject } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({ error: 'Student ID, date, and status are required' });
    }

    const result = await pool.query(
      `INSERT INTO attendance (student_id, date, status, semester, subject, college_code) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (student_id, date, subject) 
       DO UPDATE SET status = EXCLUDED.status
       RETURNING *`,
      [studentId, date, status, semester || 1, subject || null, collegeCode]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error marking attendance:', err);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

// Get student attendance
const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester } = req.query;

    let query = 'SELECT * FROM attendance WHERE student_id = $1';
    let params = [studentId];

    if (semester) {
      query += ' AND semester = $2';
      params.push(semester);
    }

    query += ' ORDER BY date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

// Get college attendance summary
const getCollegeAttendance = async (req, res) => {
  try {
    const collegeCode = req.college.college_code;

    const result = await pool.query(
      `SELECT 
        s.id, s.name, s.roll_no,
        COALESCE(AVG(a.percentage), 0) as attendance_percentage
       FROM students s
       LEFT JOIN attendance a ON s.id = a.student_id
       WHERE s.college_code = $1
       GROUP BY s.id
       ORDER BY attendance_percentage ASC`,
      [collegeCode]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching college attendance:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

// Update attendance
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date } = req.body;

    const result = await pool.query(
      `UPDATE attendance 
       SET status = $1, date = $2
       WHERE id = $3
       RETURNING *`,
      [status, date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating attendance:', err);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};

// Delete attendance
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM attendance WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (err) {
    console.error('Error deleting attendance:', err);
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
};

module.exports = {
  markAttendance,
  getStudentAttendance,
  getCollegeAttendance,
  updateAttendance,
  deleteAttendance
};