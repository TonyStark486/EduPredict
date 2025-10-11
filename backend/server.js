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
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Render PostgreSQL
});

// ==============================
// 🔹 Middleware
// ==============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow requests from Vercel Frontend
app.use(cors({
  origin: [
    "https://edu-predict-sih.vercel.app",  // ✅ your frontend
    "http://localhost:3000"                // ✅ for local testing
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

// ==============================
// 🔹 Test Route
// ==============================
app.get('/', (req, res) => {
  res.send('✅ EduPredict Student API is running on Render!');
});


// ====================================================
// 🎓 STUDENT REGISTRATION
// ====================================================
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
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, college_code`,
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


// ====================================================
// 🔑 STUDENT LOGIN
// ====================================================
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


// ====================================================
// 🚀 Start Server
// ====================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
