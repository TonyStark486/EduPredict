const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || '8830862537';

// Admin Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT * FROM admins WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    
    if (!valid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...adminData } = admin;

    res.json({
      message: 'Admin login successful',
      token,
      admin: adminData
    });

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Verify Admin
const verify = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM admins WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({ admin: result.rows[0] });
  } catch (err) {
    console.error('Admin verify error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Setup Admin
const setup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existing = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO admins (name, email, password_hash) 
       VALUES ($1, $2, $3) RETURNING id, name, email, created_at`,
      [name, email, password_hash]
    );

    res.status(201).json({
      message: 'Admin created successfully',
      admin: result.rows[0]
    });
  } catch (err) {
    console.error('Admin setup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all colleges
const getColleges = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, code, address, city, state, pincode, email, phone, 
              principal_name, college_type, category, aided, created_at 
       FROM colleges 
       ORDER BY created_at DESC`
    );

    res.json({ colleges: result.rows });
  } catch (err) {
    console.error('Error fetching colleges:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single college
const getCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, name, code, address, city, state, pincode, email, phone, 
              principal_name, college_type, category, aided, created_at 
       FROM colleges 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'College not found' });
    }

    res.json({ college: result.rows[0] });
  } catch (err) {
    console.error('Error fetching college:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add college
const addCollege = async (req, res) => {
  try {
    const { 
      name, code, address, city, state, pincode, 
      email, phone, principal_name, college_type, 
      category, aided, password 
    } = req.body;

    if (!name || !code || !email || !password) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const existing = await pool.query(
      'SELECT * FROM colleges WHERE code = $1 OR email = $2',
      [code, email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'College code or email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO colleges (name, code, address, city, state, pincode, email, phone, 
                            principal_name, college_type, category, aided, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, name, code, email, created_at`,
      [name, code, address, city, state, pincode, email, phone, 
       principal_name, college_type, category, aided, password_hash]
    );

    res.status(201).json({ 
      message: 'College added successfully',
      college: result.rows[0]
    });
  } catch (err) {
    console.error('Error adding college:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update college
const updateCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, address, city, state, pincode, 
      email, phone, principal_name, college_type, 
      category, aided 
    } = req.body;

    const checkResult = await pool.query(
      'SELECT * FROM colleges WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'College not found' });
    }

    const emailCheck = await pool.query(
      'SELECT * FROM colleges WHERE email = $1 AND id != $2',
      [email, id]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already in use by another college' });
    }

    const result = await pool.query(
      `UPDATE colleges 
       SET name = $1, address = $2, city = $3, state = $4, pincode = $5,
           email = $6, phone = $7, principal_name = $8, college_type = $9, 
           category = $10, aided = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING id, name, code, email, created_at`,
      [name, address, city, state, pincode, email, phone, 
       principal_name, college_type, category, aided, id]
    );

    res.json({ 
      message: 'College updated successfully',
      college: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating college:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete college
const deleteCollege = async (req, res) => {
  try {
    const { id } = req.params;

    const checkResult = await pool.query(
      'SELECT * FROM colleges WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'College not found' });
    }

    await pool.query('DELETE FROM colleges WHERE id = $1', [id]);

    res.json({ message: 'College deleted successfully' });
  } catch (err) {
    console.error('Error deleting college:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get admin statistics
const getStats = async (req, res) => {
  try {
    const totalColleges = await pool.query('SELECT COUNT(*) FROM colleges');
    const totalStudents = await pool.query('SELECT COUNT(*) FROM students');
    const totalTeachers = await pool.query('SELECT COUNT(*) FROM teachers');
    const totalDepartments = await pool.query('SELECT COUNT(*) FROM departments');

    res.json({
      total_colleges: parseInt(totalColleges.rows[0].count),
      total_students: parseInt(totalStudents.rows[0].count),
      total_teachers: parseInt(totalTeachers.rows[0].count),
      total_departments: parseInt(totalDepartments.rows[0].count)
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  login,
  verify,
  setup,
  getColleges,
  getCollege,
  addCollege,
  updateCollege,
  deleteCollege,
  getStats
};