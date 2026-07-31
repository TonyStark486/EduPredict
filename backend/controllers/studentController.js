const pool = require('../db');
const bcrypt = require('bcryptjs');

// Student Registration (public)
const register = async (req, res) => {
  try {
    const { roll_no, name, email, contact, college_code, course, password, confirm_password } = req.body;

    if (!roll_no || !name || !email || !contact || !college_code || !password || !confirm_password) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const duplicateRoll = await pool.query('SELECT 1 FROM students WHERE roll_no = $1', [roll_no]);
    if (duplicateRoll.rowCount > 0) {
      return res.status(409).json({ message: 'Roll number already registered.' });
    }

    const duplicateEmail = await pool.query('SELECT 1 FROM students WHERE email = $1', [email]);
    if (duplicateEmail.rowCount > 0) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO students (roll_no, name, email, contact, college_code, course, password_hash, year, semester)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, roll_no, name, email, college_code`,
      [roll_no, name, email, contact, college_code, course, hashedPassword, 1, 1]
    );

    res.status(201).json({ message: '✅ Registration successful!', student: result.rows[0] });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Student Login (public)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required.' });
    }

    const result = await pool.query('SELECT * FROM students WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email.' });
    }

    const student = result.rows[0];
    const valid = await bcrypt.compare(password, student.password_hash);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    const { password_hash, ...studentData } = student;
    res.json({ message: '✅ Login successful!', student: studentData });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all students for a college
const getStudents = async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    
    if (!collegeCode) {
      return res.status(400).json({ error: 'College code not found' });
    }

    const { department, year, search } = req.query;

    let query = `
      SELECT 
        s.id, s.roll_no, s.name, s.email, s.contact,
        s.course, s.year, s.semester,
        d.name as department_name,
        COALESCE(AVG(a.percentage), 0) as attendance_percentage,
        COALESCE(AVG(g.gpa), 0) as current_gpa
      FROM students s
      LEFT JOIN departments d ON s.department_code = d.code
      LEFT JOIN attendance a ON s.id = a.student_id
      LEFT JOIN grades g ON s.id = g.student_id
      WHERE s.college_code = $1
    `;

    const params = [collegeCode];
    let paramCount = 1;

    if (department) {
      paramCount++;
      query += ` AND d.name = $${paramCount}`;
      params.push(department);
    }

    if (year) {
      paramCount++;
      query += ` AND s.year = $${paramCount}`;
      params.push(year);
    }

    if (search) {
      paramCount++;
      query += ` AND (s.name ILIKE $${paramCount} OR s.roll_no ILIKE $${paramCount} OR s.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY s.id, d.name ORDER BY s.name ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// Get single student
const getStudent = async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    const { id } = req.params;

    if (!collegeCode) {
      return res.status(400).json({ error: 'College code not found' });
    }

    const result = await pool.query(
      `SELECT 
        s.*,
        d.name as department_name,
        COALESCE(AVG(a.percentage), 0) as attendance_percentage,
        COALESCE(AVG(g.gpa), 0) as current_gpa
       FROM students s
       LEFT JOIN departments d ON s.department_code = d.code
       LEFT JOIN attendance a ON s.id = a.student_id
       LEFT JOIN grades g ON s.id = g.student_id
       WHERE s.id = $1 AND s.college_code = $2
       GROUP BY s.id, d.name`,
      [id, collegeCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
};

// Add student
const addStudent = async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    
    if (!collegeCode) {
      return res.status(400).json({ error: 'College code not found' });
    }

    const { 
      roll_no, name, email, contact, course, 
      year, semester, department_code, parent_name, 
      parent_email, parent_phone 
    } = req.body;

    if (!roll_no || !name || !email) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const existing = await pool.query(
      'SELECT * FROM students WHERE roll_no = $1 OR email = $2',
      [roll_no, email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Student already exists' });
    }

    const result = await pool.query(
      `INSERT INTO students (
        roll_no, name, email, contact, course,
        year, semester, department_code, college_code,
        parent_name, parent_email, parent_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [roll_no, name, email, contact, course, year || 1, 
       semester || 1, department_code, collegeCode, 
       parent_name, parent_email, parent_phone]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding student:', err);
    res.status(500).json({ error: 'Failed to add student' });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    const { id } = req.params;
    const { name, email, contact, course, year, semester, department_code } = req.body;

    if (!collegeCode) {
      return res.status(400).json({ error: 'College code not found' });
    }

    const result = await pool.query(
      `UPDATE students 
       SET name = $1, email = $2, contact = $3, 
           course = $4, year = $5, semester = $6, department_code = $7
       WHERE id = $8 AND college_code = $9
       RETURNING *`,
      [name, email, contact, course, year, semester, department_code, id, collegeCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ error: 'Failed to update student' });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    const { id } = req.params;

    if (!collegeCode) {
      return res.status(400).json({ error: 'College code not found' });
    }

    const result = await pool.query(
      'DELETE FROM students WHERE id = $1 AND college_code = $2 RETURNING *',
      [id, collegeCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
};

module.exports = {
  register,
  login,
  getStudents,
  getStudent,
  addStudent,
  updateStudent,
  deleteStudent
};