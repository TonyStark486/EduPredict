require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors({ origin: "https://edu-predict-sih.vercel.app" }));
app.use(express.json());

app.post('/api/colleges/register', async (req, res) => {
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

    console.log("Inserting college:", req.body);
    const result = await pool.query(
      `INSERT INTO colleges (name, code, address, city, state, pincode, email, phone, principal_name, college_type, category, aided, password_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id,name,email,code`,
      [name, code, address, city, state, pincode, email, phone, principal_name, college_type, category, aided, password_hash]
    );
    console.log("Insert result:", result);

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

app.get('/', (req, res) => {
  res.send('EduPredict API is running.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//server connection for login page
app.post('/api/college/login', async (req, res) => {
  try {
    const { code, email, password } = req.body;
    if (!code || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Check if college exists by code and email
    const result = await pool.query(
      'SELECT * FROM colleges WHERE code = $1 AND email = $2',
      [code, email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid college code or email.' });
    }

    const college = result.rows[0];
    // Verify password using bcrypt
    const valid = await bcrypt.compare(password, college.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    // Remove the password hash from the returned college object
    const { password_hash, ...collegeData } = college;
    res.json(collegeData);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});