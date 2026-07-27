const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || '8830862537';

// ========================================
// AUTHENTICATION MIDDLEWARE - FIXED
// ========================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token decoded:', decoded);
    
    // Handle different token structures
    if (decoded.college_code || decoded.collegeCode) {
      req.college = {
        college_code: decoded.college_code || decoded.collegeCode,
        email: decoded.email,
        name: decoded.name,
        id: decoded.college_id || decoded.id
      };
    } else if (decoded.college) {
      req.college = decoded.college;
    } else {
      req.college = {
        college_code: decoded.code || decoded.collegeCode,
        email: decoded.email,
        name: decoded.name,
        id: decoded.id
      };
    }
    
    console.log('✅ College data set:', req.college);
    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ========================================
// TEST ENDPOINT
// ========================================
app.get('/', (req, res) => {
  res.json({ 
    message: 'EduPredict Backend API is running!',
    version: '1.0.0',
    status: 'active'
  });
});

// ========================================
// ADMIN AUTHENTICATION
// ========================================

// Admin Login
app.post('/api/admin/login', async (req, res) => {
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
});

// Verify Admin Token
app.get('/api/admin/verify', authenticateToken, async (req, res) => {
  try {
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

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
});

// Create First Admin (Run once)
app.post('/api/admin/setup', async (req, res) => {
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
});

// ========================================
// ADMIN COLLEGE MANAGEMENT ROUTES
// ========================================

// Get all colleges
app.get('/api/admin/colleges', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

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
});

// Get single college
app.get('/api/admin/colleges/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

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
});

// Add new college
app.post('/api/admin/colleges', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

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
});

// Update college
app.put('/api/admin/colleges/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

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
});

// Delete college
app.delete('/api/admin/colleges/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

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
});

// Get admin statistics
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

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
});

// ========================================
// COLLEGE AUTHENTICATION
// ========================================

// College Registration
app.post('/api/college/register', async (req, res) => {
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
       RETURNING id, name, email, code`,
      [name, code, address, city, state, pincode, email, phone, principal_name, college_type, category, aided, password_hash]
    );

    res.status(201).json({ message: 'College registered successfully', college: result.rows[0] });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// College Login
app.post('/api/college/login', async (req, res) => {
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
});

// ========================================
// COLLEGE DASHBOARD ROUTES
// ========================================

// Get college statistics
app.get('/api/college/stats', authenticateToken, async (req, res) => {
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
});

// Get recent activities
app.get('/api/college/recent-activities', authenticateToken, async (req, res) => {
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
});

// ========================================
// DEPARTMENT ROUTES - FIXED
// ========================================

// Get all departments for a college
app.get('/api/college/departments', authenticateToken, async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    
    if (!collegeCode) {
      return res.status(400).json({ error: 'College code not found' });
    }

    console.log('📊 Fetching departments for college:', collegeCode);

    const result = await pool.query(
      `SELECT 
        id, 
        name, 
        code,
        hod_name,
        status,
        created_at,
        (SELECT COUNT(*) FROM students WHERE department_id = departments.id) as student_count,
        (SELECT COUNT(*) FROM teachers WHERE department_id = departments.id) as teacher_count
       FROM departments
       WHERE college_code = $1
       ORDER BY name ASC`,
      [collegeCode]
    );

    console.log(`✅ Found ${result.rows.length} departments`);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching departments:', err);
    res.status(500).json({ error: 'Failed to fetch departments', message: err.message });
  }
});

// Add a new department
app.post('/api/college/departments', authenticateToken, async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    
    if (!collegeCode) {
      return res.status(400).json({ error: 'College code not found' });
    }

    const { name, code, hod, status } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required' });
    }

    console.log('📊 Adding department:', { name, code, hod, collegeCode });

    // Check if department already exists
    const existing = await pool.query(
      'SELECT * FROM departments WHERE (name = $1 OR code = $2) AND college_code = $3',
      [name, code, collegeCode]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Department name or code already exists' });
    }

    const result = await pool.query(
      `INSERT INTO departments (name, code, hod_name, status, college_code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, code, hod_name, status, created_at`,
      [name, code, hod || null, status || 'active', collegeCode]
    );

    console.log('✅ Department added:', result.rows[0]);
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('❌ Error adding department:', err);
    res.status(500).json({ error: 'Failed to add department', message: err.message });
  }
});

// Update a department
app.put('/api/college/departments/:id', authenticateToken, async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    const { id } = req.params;
    const { name, hod, status } = req.body;

    if (!collegeCode) {
      return res.status(400).json({ error: 'College code not found' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    console.log('📊 Updating department:', { id, name, hod, collegeCode });

    const result = await pool.query(
      `UPDATE departments 
       SET name = $1, hod_name = $2, status = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND college_code = $5
       RETURNING *`,
      [name, hod || null, status || 'active', id, collegeCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    console.log('✅ Department updated:', result.rows[0]);
    res.json(result.rows[0]);

  } catch (err) {
    console.error('❌ Error updating department:', err);
    res.status(500).json({ error: 'Failed to update department', message: err.message });
  }
});

// Delete a department
app.delete('/api/college/departments/:id', authenticateToken, async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    const { id } = req.params;

    if (!collegeCode) {
      return res.status(400).json({ error: 'College code not found' });
    }

    console.log('📊 Deleting department:', { id, collegeCode });

    // Check if department has students
    const hasStudents = await pool.query(
      'SELECT COUNT(*) FROM students WHERE department_id = $1',
      [id]
    );

    if (parseInt(hasStudents.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete department with assigned students. Please reassign students first.' 
      });
    }

    // Check if department has teachers
    const hasTeachers = await pool.query(
      'SELECT COUNT(*) FROM teachers WHERE department_id = $1',
      [id]
    );

    if (parseInt(hasTeachers.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete department with assigned teachers. Please reassign teachers first.' 
      });
    }

    const result = await pool.query(
      'DELETE FROM departments WHERE id = $1 AND college_code = $2 RETURNING *',
      [id, collegeCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    console.log('✅ Department deleted:', result.rows[0]);
    res.json({ message: 'Department deleted successfully' });

  } catch (err) {
    console.error('❌ Error deleting department:', err);
    res.status(500).json({ error: 'Failed to delete department', message: err.message });
  }
});

// ========================================
// STUDENT ROUTES
// ========================================

// Get all students
app.get('/api/college/students', authenticateToken, async (req, res) => {
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
      LEFT JOIN departments d ON s.department_id = d.id
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
});

// Get single student
app.get('/api/college/students/:id', authenticateToken, async (req, res) => {
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
       LEFT JOIN departments d ON s.department_id = d.id
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
});

// Add student
app.post('/api/college/students', authenticateToken, async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    
    if (!collegeCode) {
      return res.status(400).json({ error: 'College code not found' });
    }

    const { 
      roll_no, name, email, contact, course, 
      year, semester, department_id, parent_name, 
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
        year, semester, department_id, college_code,
        parent_name, parent_email, parent_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [roll_no, name, email, contact, course, year || 1, 
       semester || 1, department_id, collegeCode, 
       parent_name, parent_email, parent_phone]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding student:', err);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// Update student
app.put('/api/college/students/:id', authenticateToken, async (req, res) => {
  try {
    const collegeCode = req.college.college_code;
    const { id } = req.params;
    const { name, email, contact, course, year, semester, department_id } = req.body;

    if (!collegeCode) {
      return res.status(400).json({ error: 'College code not found' });
    }

    const result = await pool.query(
      `UPDATE students 
       SET name = $1, email = $2, contact = $3, 
           course = $4, year = $5, semester = $6, department_id = $7
       WHERE id = $8 AND college_code = $9
       RETURNING *`,
      [name, email, contact, course, year, semester, department_id, id, collegeCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
app.delete('/api/college/students/:id', authenticateToken, async (req, res) => {
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
});

// ========================================
// STUDENT REGISTRATION & LOGIN (Public)
// ========================================

app.post('/register/student', async (req, res) => {
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
});

app.post('/login/student', async (req, res) => {
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
});

// ========================================
// PARENT REGISTRATION & LOGIN
// ========================================

app.post('/register/parent', async (req, res) => {
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
});

app.post('/login/parent', async (req, res) => {
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
});

// ========================================
// TEACHER REGISTRATION & LOGIN
// ========================================

app.post('/register/teacher', async (req, res) => {
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
});

app.post('/api/teacher/login', async (req, res) => {
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
});

// ========================================
// DEBUG ENDPOINT
// ========================================

app.get('/api/debug/token', authenticateToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    college: req.college,
    user: req.user
  });
});

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
  console.log(`🔑 JWT Secret: ${JWT_SECRET ? 'Set' : 'Not set'}`);
});

module.exports = pool;