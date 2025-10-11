require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();

// ==============================
// 🔹 PostgreSQL Connection
// ==============================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://database_8suu_user:JhWakO3g5BhqleKSRSd87yFw3tOpf5xF@dpg-d3imcvadbo4c73fs18rg-a.oregon-postgres.render.com/database_8suu?sslmode=require"
  
});


// ==============================
// 🔹 Middlewares
// ==============================
app.use(cors({ origin: "https://edu-predict-sih.vercel.app" })); // adjust origin if running locally
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================
// 🔹 Root
// ==============================
app.get('/', (req, res) => {
  res.send('EduPredict API is running.');
});


// ====================================================
// 🏫 COLLEGE REGISTRATION & LOGIN (Already Working)
// ====================================================
app.post('/api/colleges/register', async (req, res) => {
  const aided = req.body.aided === 'true';
  try {
    const {
      name, code, address, city, state, pincode,
      email, phone, principal_name,
      college_type, category, aided, password
    } = req.body;

    if (!name || !code || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO colleges (name, code, address, city, state, pincode, email, phone, principal_name, college_type, category, aided, password_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id,name,email,code`,
      [name, code, address, city, state, pincode, email, phone, principal_name, college_type, category, aided, password_hash]
    );

    res.status(201).json({ message: "College Registered", college: result.rows[0] });

  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'College code or email already exists.' });
    } else {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

app.post('/api/college/login', async (req, res) => {
  try {
    const { code, email, password } = req.body;
    if (!code || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const result = await pool.query(
      'SELECT * FROM colleges WHERE code = $1 AND email = $2',
      [code, email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid college code or email.' });
    }

    const college = result.rows[0];
    const valid = await bcrypt.compare(password, college.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    const { password_hash, ...collegeData } = college;
    res.json(collegeData);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



// ====================================================
// 🎓 STUDENT REGISTRATION & LOGIN (Newly Added)
// ====================================================

// 🟢 Register
app.post('/register/student', async (req, res) => {
  try {
    const { name, email, contact, college_code, course, password, confirm_password } = req.body;

    if (!name || !email || !contact || !college_code || !password || !confirm_password) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO students (name, email, contact, college_code, course, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, college_code`,
      [name, email, contact, college_code, course, hashedPassword]
    );

    res.status(201).json({ message: '✅ Registration successful!', student: result.rows[0] });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === '23505') {
      res.status(409).json({ message: 'Email already registered.' });
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// 🟡 Login
app.post('/login/student', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required.' });
    }

    const result = await pool.query(
      'SELECT * FROM students WHERE email = $1',
      [email]
    );

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


// ====================================================
// 🚀 Start Server
// ====================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
