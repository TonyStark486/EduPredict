const pool = require('../db');
const bcrypt = require('bcryptjs');

// Parent Registration
const register = async (req, res) => {
  try {
    const { name, email, phone, student_email, relationship, password, confirm_password } = req.body;

    if (!name || !email || !phone || !student_email || !relationship || !password || !confirm_password) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const studentResult = await pool.query('SELECT id FROM students WHERE email = $1', [student_email]);

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student with this email not found.' });
    }

    const student_id = studentResult.rows[0].id;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO parents (name, email, phone, student_id, relationship, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, phone, relationship`,
      [name, email, phone, student_id, relationship, hashedPassword]
    );

    res.status(201).json({ message: '✅ Parent registration successful!', parent: result.rows[0] });
  } catch (err) {
    console.error('Parent registration error:', err);
    if (err.code === '23505') {
      res.status(409).json({ message: 'Email already registered.' });
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
};

// Parent Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required.' });
    }

    const result = await pool.query(
      `SELECT p.*, s.name as student_name 
       FROM parents p 
       LEFT JOIN students s ON p.student_id = s.id 
       WHERE p.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email.' });
    }

    const parent = result.rows[0];
    const valid = await bcrypt.compare(password, parent.password_hash);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    const { password_hash, ...parentData } = parent;
    res.json({ message: '✅ Login successful!', parent: parentData });
  } catch (err) {
    console.error('Parent login error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get parents by student
const getParentsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const result = await pool.query(
      'SELECT id, name, email, phone, relationship FROM parents WHERE student_id = $1',
      [studentId]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching parents:', err);
    res.status(500).json({ error: 'Failed to fetch parents' });
  }
};

// Get single parent
const getParent = async (req, res) => {
  try {
    const { parentId } = req.params;
    
    const result = await pool.query(
      `SELECT p.*, s.name as student_name, s.roll_no 
       FROM parents p
       LEFT JOIN students s ON p.student_id = s.id
       WHERE p.id = $1`,
      [parentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }
    
    const { password_hash, ...parentData } = result.rows[0];
    res.json(parentData);
  } catch (err) {
    console.error('Error fetching parent:', err);
    res.status(500).json({ error: 'Failed to fetch parent' });
  }
};

// Update parent
const updateParent = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { name, email, phone, relationship } = req.body;
    
    const result = await pool.query(
      `UPDATE parents 
       SET name = $1, email = $2, phone = $3, relationship = $4
       WHERE id = $5
       RETURNING id, name, email, phone, relationship`,
      [name, email, phone, relationship, parentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }
    
    res.json({ message: 'Parent updated successfully', parent: result.rows[0] });
  } catch (err) {
    console.error('Error updating parent:', err);
    res.status(500).json({ error: 'Failed to update parent' });
  }
};

module.exports = {
  register,
  login,
  getParentsByStudent,
  getParent,
  updateParent
};