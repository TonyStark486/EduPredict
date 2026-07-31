const pool = require('../db');
const bcrypt = require('bcryptjs');

// Register teacher (public)
const register = async (req, res) => {
  try {
    const { name, email, subject, department, password, confirm_password } = req.body;

    if (!name || !email || !subject || !department || !password || !confirm_password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const emailCheck = await pool.query('SELECT 1 FROM teachers WHERE email = $1', [email]);
    if (emailCheck.rowCount > 0) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const insertRes = await pool.query(
      `INSERT INTO teachers (name, email, password_hash, subject, department)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING teacher_id, name, email, subject, department, created_at`,
      [name, email, password_hash, subject, department]
    );
    res.status(201).json({ message: "✅ Registration successful!", teacher: insertRes.rows[0] });

  } catch (err) {
    console.error('Teacher registration error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Teacher login (public)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await pool.query('SELECT * FROM teachers WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email.' });
    }

    const teacher = result.rows[0];
    const valid = await bcrypt.compare(password, teacher.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    const { password_hash, ...teacherData } = teacher;
    res.json(teacherData);

  } catch (err) {
    console.error('Teacher login error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Get all teachers for a college
const getTeachers = async (req, res) => {
  try {
    const { collegeCode } = req.params;
    
    const result = await pool.query(
      `SELECT t.*, d.name as department_name, d.code as department_code
       FROM teachers t
       LEFT JOIN departments d ON t.department_id = d.id
       WHERE t.college_code = $1
       ORDER BY t.name`,
      [collegeCode]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching teachers:', err);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
};

// Add teacher
const addTeacher = async (req, res) => {
  try {
    const { collegeCode } = req.params;
    const { name, email, teacher_id, department_id, password, confirm_password, designation, phone, qualification } = req.body;
    
    // Validate required fields
    if (!name || !email || !teacher_id || !department_id || !password) {
      return res.status(400).json({ 
        error: 'Name, email, teacher ID, department, and password are required' 
      });
    }
    
    // Check if password matches confirm password
    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    // Check if teacher already exists
    const existingTeacher = await pool.query(
      'SELECT * FROM teachers WHERE email = $1 OR teacher_id = $2',
      [email, teacher_id]
    );
    
    if (existingTeacher.rows.length > 0) {
      return res.status(400).json({ error: 'Teacher with this email or ID already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert teacher
    const result = await pool.query(
      `INSERT INTO teachers (college_code, name, email, teacher_id, department_id, password_hash, designation, phone, qualification) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING teacher_id, name, email, department_id, designation, phone, qualification, created_at`,
      [collegeCode, name, email, teacher_id, department_id, hashedPassword, designation || null, phone || null, qualification || null]
    );
    
    res.status(201).json({ 
      message: 'Teacher added successfully', 
      teacher: result.rows[0] 
    });
    
  } catch (err) {
    console.error('Error adding teacher:', err);
    res.status(500).json({ error: 'Failed to add teacher' });
  }
};

// Update teacher
const updateTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { name, email, department_id, designation, phone, qualification } = req.body;
    
    const result = await pool.query(
      `UPDATE teachers 
       SET name = $1, email = $2, department_id = $3, designation = $4, phone = $5, qualification = $6
       WHERE teacher_id = $7
       RETURNING *`,
      [name, email, department_id, designation, phone, qualification, teacherId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json({ message: 'Teacher updated successfully', teacher: result.rows[0] });
  } catch (err) {
    console.error('Error updating teacher:', err);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
};

// Delete teacher
const deleteTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM teachers WHERE teacher_id = $1 RETURNING *',
      [teacherId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json({ message: 'Teacher deleted successfully' });
  } catch (err) {
    console.error('Error deleting teacher:', err);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
};

module.exports = {
  register,
  login,
  getTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher
};