const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || '8830862537';

// College Registration
const register = async (req, res) => {
  try {
    const { name, code, address, city, state, pincode, email, phone, principal_name, college_type, category, aided, password } = req.body;

    if (!name || !code || !email || !password) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const existing = await pool.query('SELECT * FROM colleges WHERE code = $1 OR email = $2', [code, email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'College code or email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO colleges (name, code, address, city, state, pincode, email, phone, principal_name, college_type, category, aided, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, name, email, code, created_at`,
      [name, code, address, city, state, pincode, email, phone, principal_name, college_type, category, aided, password_hash]
    );

    res.status(201).json({ message: 'College registered successfully', college: result.rows[0] });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
};

// College Login
const login = async (req, res) => {
  try {
    console.log('📥 Login request:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT * FROM colleges WHERE email = $1',
      [email]
    );
    
    console.log('📊 Query result:', result.rows.length, 'colleges found');

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const college = result.rows[0];
    const valid = await bcrypt.compare(password, college.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: college.id,
        college_code: college.code,
        email: college.email,
        name: college.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...collegeData } = college;

    console.log('✅ Login successful for:', email);
    console.log('✅ College code:', college.code);

    return res.status(200).json({ 
      token: token,
      college: collegeData 
    });

  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
};

// Get college statistics
const getStats = async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    
    if (!collegeCode) {
      return res.status(400).json({ error: 'College code not found' });
    }

    const totalStudents = await pool.query(
      'SELECT COUNT(*) FROM students WHERE college_code = $1',
      [collegeCode]
    );

    const totalTeachers = await pool.query(
      'SELECT COUNT(*) FROM teachers WHERE college_code = $1',
      [collegeCode]
    );

    const totalDepartments = await pool.query(
      'SELECT COUNT(*) FROM departments WHERE college_code = $1',
      [collegeCode]
    );

    const atRiskStudents = await pool.query(
      `SELECT COUNT(DISTINCT s.id) 
       FROM students s
       JOIN predictions p ON s.id = p.student_id
       WHERE s.college_code = $1 
       AND p.risk_level IN ('High', 'Medium')
       AND p.created_at = (SELECT MAX(created_at) FROM predictions WHERE student_id = s.id)`,
      [collegeCode]
    );

    res.json({
      totalStudents: parseInt(totalStudents.rows[0].count) || 0,
      totalTeachers: parseInt(totalTeachers.rows[0].count) || 0,
      totalDepartments: parseInt(totalDepartments.rows[0].count) || 0,
      atRiskStudents: parseInt(atRiskStudents.rows[0].count) || 0
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    
    if (!collegeCode) {
      return res.status(400).json({ error: 'College code not found' });
    }

    const activities = await pool.query(
      `SELECT 
        'student_added' as type,
        s.name as student_name,
        s.created_at as timestamp
       FROM students s
       WHERE s.college_code = $1
       UNION ALL
       SELECT 
        'prediction_made' as type,
        s.name as student_name,
        p.created_at as timestamp
       FROM predictions p
       JOIN students s ON p.student_id = s.id
       WHERE s.college_code = $1
       ORDER BY timestamp DESC
       LIMIT 10`,
      [collegeCode]
    );

    res.json(activities.rows);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

// Get college profile
const getProfile = async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    
    const result = await pool.query(
      'SELECT id, name, code, address, city, state, pincode, email, phone, principal_name, college_type, category, aided, created_at FROM colleges WHERE code = $1',
      [collegeCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'College not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update college profile
const updateProfile = async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    const { name, address, city, state, pincode, phone, principal_name } = req.body;

    const result = await pool.query(
      `UPDATE colleges 
       SET name = $1, address = $2, city = $3, state = $4, pincode = $5, phone = $6, principal_name = $7, updated_at = CURRENT_TIMESTAMP
       WHERE code = $8
       RETURNING id, name, code, address, city, state, pincode, email, phone, principal_name, updated_at`,
      [name, address, city, state, pincode, phone, principal_name, collegeCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'College not found' });
    }

    res.json({ message: 'Profile updated successfully', college: result.rows[0] });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = {
  register,
  login,
  getStats,
  getRecentActivities,
  getProfile,
  updateProfile
};